/**
 * Web/native module surface parity — the gate that would have caught R9-13.
 *
 * Metro resolves a BARE specifier (`@lib/reading/redLetterText`) to the
 * `.web` sibling when bundling for web, and to the plain file otherwise.
 * Neither of this repo's two static gates can see that substitution:
 * `tsc` has no platform awareness (it always type-checks against the native
 * file — the trap already documented in app/_layout.web.tsx:7-11), and jest
 * runs `preset: 'jest-expo'` on the NATIVE platform, so a bare import inside
 * a test also loads the native file. A symbol that exists on the native side
 * and not on the web side therefore type-checks clean, tests green, and
 * throws `X is not a function` in the browser — which the global
 * ErrorBoundary escalates into a blank web app, since there is no per-route
 * boundary. That is exactly how `hasRedLetterData` shipped broken in
 * d753a6e (2026-08-18).
 *
 * The invariant is deliberately ONE-DIRECTIONAL: native ⊆ web.
 *   - A symbol on native but missing on web is a crash, because the bare
 *     specifier that every shared component writes silently becomes the web
 *     file at bundle time.
 *   - The reverse is fine and intentional: a web-only extra
 *     (`loadRedLetterSpans`, `clearWebStorageForLockRecovery`) is only ever
 *     reachable through the EXPLICIT `.web` specifier, which native code
 *     never writes.
 *
 * This PARSES the sources rather than requiring them, and that is the point:
 * half these files are screens whose import graph pulls in native-only
 * dependencies, so a require-based check would need a wall of mocks per pair
 * and would rot. Parsing costs nothing at runtime — `ts.createSourceFile`
 * builds a syntax tree without type-checking, resolving a module, or
 * executing a line.
 *
 * R9-67: this used to be a regex scan over the raw text, and that scan was
 * blind in a way that mattered. `runtimeExports` only understood
 * `export [async] function|const|let|class|enum`, so a file written as
 * `function f() {}` + `export {f};` reported ZERO exports — and comparing
 * against zero always passes. Reproduced against this very gate: declaring
 * `hasRedLetterData` in redLetterText.ts with a trailing `export {…}` while
 * redLetterText.web.ts did not export it at all — R9-13, verbatim — left the
 * suite green at 30/30. The header said "verified that no pair uses
 * `export {x} from` or `export *`; if one starts to, teach the scanner" but
 * nothing DETECTED the day one started to, so the promise had no enforcement
 * behind it. The AST removes the blind spot for every form it can resolve,
 * and `unresolvableExports` below fails loudly for the one form it cannot
 * (`export *`, whose names are only knowable by following the re-export).
 */
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

const REPO_ROOT = path.resolve(__dirname, '..');
const SEARCH_ROOTS = ['src', 'app'];

/**
 * Native exports that are deliberately absent from the web sibling. Each
 * entry needs a reason: this list is the escape hatch, so an undocumented
 * entry is indistinguishable from the bug.
 */
const ALLOWED_NATIVE_ONLY: Readonly<Record<string, readonly string[]>> = {
  // A pure helper exported only so __tests__/heroNudgeRoute.test.ts can
  // reach it; nothing imports it across module boundaries, and the web home
  // screen (index.web.tsx) is a different screen that does not use it. No
  // bare specifier resolves to it at runtime, so there is nothing to crash.
  'app/(tabs)/index.tsx': ['heroNudgeRoute'],
};

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(full, out);
    } else if (/\.web\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function repoRelative(absolute: string): string {
  return path.relative(REPO_ROOT, absolute).split(path.sep).join('/');
}

interface ExportSurface {
  /** Named exports that still exist at runtime — `interface`/`type` are erased. */
  runtime: Set<string>;
  hasDefault: boolean;
  /**
   * Export forms whose names cannot be known without following the
   * re-export (`export * from './x'`). Reported rather than ignored: an
   * unreadable export is exactly as dangerous as a missing one, because the
   * comparison silently weakens instead of failing.
   */
  unresolvable: string[];
  /** Type names declared at top level, exported or not. */
  declaredTypes: Set<string>;
  /**
   * Type names the file EXPORTS. Evidence of a shared contract, but NOT the
   * only evidence — see R9-76 below: whether the native sibling exports a type
   * is a choice the file being checked makes for itself.
   */
  exportedTypes: Set<string>;
}

function isExported(node: ts.Node): boolean {
  return (
    ts.canHaveModifiers(node) &&
    !!ts.getModifiers(node)?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
  );
}

function isDefault(node: ts.Node): boolean {
  return (
    ts.canHaveModifiers(node) &&
    !!ts.getModifiers(node)?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)
  );
}

/** Every binding a declaration introduces, destructuring patterns included. */
function bindingNames(name: ts.BindingName, out: string[] = []): string[] {
  if (ts.isIdentifier(name)) {
    out.push(name.text);
  } else {
    for (const element of name.elements) {
      if (ts.isBindingElement(element)) bindingNames(element.name, out);
    }
  }
  return out;
}

function exportSurface(file: string, source: string): ExportSurface {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const runtime = new Set<string>();
  const unresolvable: string[] = [];
  const declaredTypes = new Set<string>();
  const exportedTypes = new Set<string>();
  let hasDefault = false;
  const describe = (node: ts.Node): string =>
    node.getText(sourceFile).slice(0, 80).split('\n')[0].trim();

  for (const statement of sourceFile.statements) {
    // `export default <expr>` and `export = <expr>`.
    if (ts.isExportAssignment(statement)) {
      hasDefault = true;
      continue;
    }

    // `export {a, b as c}` / `export {a} from './x'` / `export * from './x'`.
    if (ts.isExportDeclaration(statement)) {
      if (statement.isTypeOnly) continue; // `export type {…}` — erased.
      if (!statement.exportClause) {
        unresolvable.push(describe(statement));
        continue;
      }
      if (ts.isNamespaceExport(statement.exportClause)) {
        // `export * as ns from './x'` — one runtime binding, and it is named.
        runtime.add(statement.exportClause.name.text);
        continue;
      }
      for (const element of statement.exportClause.elements) {
        if (element.isTypeOnly) continue; // `export {type Foo}` — erased.
        if (element.name.text === 'default') hasDefault = true;
        else runtime.add(element.name.text);
      }
      continue;
    }

    // Types are erased at compile time, so they cannot themselves produce the
    // runtime `X is not a function` this gate exists to prevent — but a
    // redeclared one lets a shared contract drift, which produces it one
    // level down. Collected before the export check, since a native type can
    // be private and still be the shape both sides must agree on.
    if (
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement)
    ) {
      declaredTypes.add(statement.name.text);
      if (isExported(statement)) exportedTypes.add(statement.name.text);
      continue;
    }

    if (!isExported(statement)) continue;

    if (ts.isVariableStatement(statement)) {
      // `export const a = 1, b = 2` declares TWO bindings; the old regex saw
      // only the first. Destructuring (`export const {a, b} = …`) it saw not
      // at all.
      for (const declaration of statement.declarationList.declarations) {
        for (const name of bindingNames(declaration.name)) runtime.add(name);
      }
      continue;
    }

    if (
      ts.isFunctionDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isEnumDeclaration(statement) ||
      ts.isModuleDeclaration(statement)
    ) {
      // `export default function foo()` binds as `default`, not as `foo`.
      if (isDefault(statement)) hasDefault = true;
      else if (statement.name && ts.isIdentifier(statement.name)) {
        runtime.add(statement.name.text);
      } else {
        unresolvable.push(describe(statement));
      }
      continue;
    }

    unresolvable.push(describe(statement));
  }

  return {runtime, hasDefault, unresolvable, declaredTypes, exportedTypes};
}

function surfaceOf(absoluteFile: string): ExportSurface {
  return exportSurface(absoluteFile, fs.readFileSync(absoluteFile, 'utf8'));
}

/**
 * Types the WEB file declares that are really a SHARED contract, so a local
 * copy of one lets the two sides drift with `tsc` green (see the R9-70 case
 * below for the mechanism).
 *
 * R9-79: the discriminator cannot ask the native sibling anything, because the
 * shared contract does not have to live there. `AudioPlayerContext.tsx` imports
 * `AudioPlayerContextValue` from `../types/audio` — so the native sibling
 * neither declares nor exports it, and both of the older rules go quiet. That
 * is one of the four context pairs this gate's own comment cites as its
 * justification, and it was found by probe: a diverged local copy in
 * AudioPlayerContext.web.tsx left the suite at 72/72.
 *
 * So the rule for a `…ContextValue` is now unconditional: a `.web` file has no
 * business DECLARING one at all. That name is what a provider/hook contract is
 * called here, in all four pairs, and the remedy is a one-line type-only import
 * from wherever the contract already lives. Every other name still needs the
 * native sibling to EXPORT it, which keeps a private `Props`/`State`/
 * `…ProviderProps`/`SpanMap`/`ChapterItem` that both files happen to name the
 * same out of the way — flagging those would bury the signal.
 */
function redeclaredSharedTypes(
  native: ExportSurface,
  web: ExportSurface,
): string[] {
  return [...web.declaredTypes].filter(
    name => native.exportedTypes.has(name) || /ContextValue$/.test(name),
  );
}

function nativeSiblingOf(webFile: string): string | null {
  const base = webFile.replace(/\.web\.tsx?$/, '');
  for (const ext of ['.ts', '.tsx']) {
    if (fs.existsSync(base + ext)) return base + ext;
  }
  return null;
}

const webFiles = SEARCH_ROOTS.flatMap(root => walk(path.join(REPO_ROOT, root)));

describe('web/native module surface parity', () => {
  it('finds the .web files to compare (guards against the walker silently matching nothing)', () => {
    // Without this, a broken glob would turn every it.each below into zero
    // cases and the whole suite would pass by describing nothing.
    expect(webFiles.length).toBeGreaterThanOrEqual(14);
  });

  it.each(webFiles.map(f => [repoRelative(f), f]))(
    '%s has a native sibling',
    (_label, webFile) => {
      // A .web file with no plain sibling means any bare specifier pointing
      // at it fails to resolve on native at all.
      expect(nativeSiblingOf(webFile as string)).not.toBeNull();
    },
  );

  it.each(webFiles.map(f => [repoRelative(f), f]))(
    '%s exports everything its native sibling exports',
    (_label, webFile) => {
      const nativeFile = nativeSiblingOf(webFile as string);
      if (!nativeFile) return; // reported by the case above
      const native = surfaceOf(nativeFile);
      const web = surfaceOf(webFile as string);

      const allowed = new Set(
        ALLOWED_NATIVE_ONLY[repoRelative(nativeFile)] ?? [],
      );
      const missing = [...native.runtime]
        .filter(name => !web.runtime.has(name))
        .filter(name => !allowed.has(name));

      expect(missing).toEqual([]);

      if (native.hasDefault) {
        expect(web.hasDefault).toBe(true);
      }
    },
  );

  it.each(
    webFiles.flatMap(f => {
      const native = nativeSiblingOf(f);
      return native
        ? [
            [repoRelative(f), f],
            [repoRelative(native), native],
          ]
        : [[repoRelative(f), f]];
    }),
  )('%s uses only export forms this gate can read', (_label, file) => {
    // R9-67: the case that makes the comparison above trustworthy. A form
    // the scanner cannot resolve does not make it complain — it makes it
    // compare against a SHORTER list and pass. `export * from './x'` is the
    // one such form left, so it has to fail HERE, loudly, the day a pair
    // starts using it. Teach the scanner (and delete this expectation's
    // reason), never the reverse.
    expect(surfaceOf(file as string).unresolvable).toEqual([]);
  });

  it.each(webFiles.map(f => [repoRelative(f), f]))(
    '%s imports its shared types instead of redeclaring them',
    (_label, webFile) => {
      // R9-70: the same divergence as above, one level DOWN. The gate
      // compares module export NAMES, and a context's value type is not a
      // module export — it is the contract between a provider and everything
      // that calls its hook. `PremiumContext.web.tsx` redeclared
      // `PremiumContextValue` locally, so adding a member to the native one
      // left the web stub silently short of it: `tsc` resolves a bare
      // specifier to the NATIVE file, sees the native shape, and passes.
      // Verified by probe — extending the native interface and satisfying it
      // on the native side left `tsc --noEmit` completely green while the web
      // stub never implemented the new member, which on web is
      // `x.y is not a function`: R9-13's crash, from a different direction.
      //
      // The rule is narrow on purpose: a private `Props`/`State`/
      // `…ProviderProps`/`SpanMap`/`ChapterItem` that both files happen to name
      // the same is genuinely local to each, and flagging those would bury the
      // signal.
      //
      // R9-76 widened this from "the native sibling EXPORTS it" to "…or
      // declares it privately", because whether it exports is a decision the
      // offending code makes for itself. R9-79 widened it again for the same
      // reason one level further out — the contract need not be in the native
      // sibling AT ALL. See redeclaredSharedTypes above, and the synthetic
      // cases at the bottom of this file, which are the only positive examples
      // there are: after R9-70 no real pair trips this, so without them the
      // rule is fourteen comparisons that all come back empty.
      const nativeFile = nativeSiblingOf(webFile as string);
      if (!nativeFile) return; // reported by the case above
      expect(
        redeclaredSharedTypes(
          surfaceOf(nativeFile),
          surfaceOf(webFile as string),
        ),
      ).toEqual([]);
    },
  );

  describe('the rule itself, against synthetic pairs (its only positive cases)', () => {
    // Every real pair passes this rule, which is the point of having fixed
    // them — and it also means the fourteen comparisons above prove nothing
    // about whether the rule still WORKS. These are the control.
    const surface = (source: string, name = 'probe.tsx'): ExportSurface =>
      exportSurface(name, source);

    it('flags a ContextValue the native sibling only IMPORTS (R9-79)', () => {
      // The live shape: AudioPlayerContext.tsx imports its contract from
      // ../types/audio, so asking the native sibling to declare or export it
      // gets a "no" that means nothing.
      const native = surface(
        "import {AudioPlayerContextValue} from '../types/audio';\n" +
          'export const AudioPlayerProvider = () => null;\n',
      );
      const web = surface(
        'interface AudioPlayerContextValue { state: number }\n' +
          'export const AudioPlayerProvider = () => null;\n',
      );
      expect(redeclaredSharedTypes(native, web)).toEqual([
        'AudioPlayerContextValue',
      ]);
    });

    it('flags a ContextValue the native sibling keeps PRIVATE (R9-76)', () => {
      // Pinned rather than merely probed: this was the state
      // OfferingSheetContextValue was in until R9-70 fixed it by hand.
      const native = surface('interface FiveContextValue { a: number }\n');
      const web = surface('interface FiveContextValue { }\n');
      expect(redeclaredSharedTypes(native, web)).toEqual(['FiveContextValue']);
    });

    it('flags any type the native sibling EXPORTS (R9-70)', () => {
      const native = surface('export interface SpanShape { a: number }\n');
      const web = surface('interface SpanShape { }\n');
      expect(redeclaredSharedTypes(native, web)).toEqual(['SpanShape']);
    });

    it('does NOT flag a private shape both files happen to name the same', () => {
      // The narrowness control. Without it the rule could be widened to "any
      // repeated type name" and would bury the signal under Props/State.
      const native = surface(
        'interface Props { a: number }\ninterface SpanMap { b: number }\n',
      );
      const web = surface(
        'interface Props { a: number }\ninterface SpanMap { b: number }\n',
      );
      expect(redeclaredSharedTypes(native, web)).toEqual([]);
    });

    it('does NOT flag a web file that declares no types at all', () => {
      expect(
        redeclaredSharedTypes(
          surface('export interface AContextValue { a: number }\n'),
          surface('export const x = 1;\n'),
        ),
      ).toEqual([]);
    });
  });

  it('has no stale entries in the native-only allowlist', () => {
    // An allowlist that outlives its reason stops being documentation and
    // starts being a hole.
    for (const [relative, names] of Object.entries(ALLOWED_NATIVE_ONLY)) {
      const absolute = path.join(REPO_ROOT, relative);
      expect(fs.existsSync(absolute)).toBe(true);
      const exported = surfaceOf(absolute).runtime;
      for (const name of names) expect([...exported]).toContain(name);
    }
  });
});
