/**
 * R9-82 — the Node version CI runs on is part of the contract, and nothing
 * checked it.
 *
 * `scripts/build-web-packs.js` requires `node:sqlite`. That was harmless while
 * the script was only ever run by hand on Victor's machine (Node 24) — but
 * session 13 put a jest suite in front of it (`__tests__/buildWebPacks.test.js`,
 * R9-66), and `.github/workflows/ci.yml` pinned `node-version: '20'`. So from
 * that day the gate guarding the only thing in this repo that produces
 * PUBLISHED data never executed in CI at all:
 *
 *     FAIL __tests__/buildWebPacks.test.js
 *       ● Test suite failed to run
 *         No such built-in module: node:sqlite
 *
 * It was green locally on Node 24 and red in CI for four consecutive pushes to
 * `main`, and the only thing that said so was a GitHub notification email. The
 * suite's SILENCE meant "verified" locally and "I never loaded" in CI, and
 * there was no way to tell the two apart from inside the repo.
 *
 * ── R9-88 / R9-89 / R9-90: this detector's own second draft ──────────────────
 *
 * The first draft read the workflow with `/node-version:\s*'([^']+)'/g` and
 * compared `parseInt(value, 10)` against the major `22`. Both halves leaked,
 * and both leaks are the shape this review keeps finding — a gate closes the
 * case that motivated it and leaves the neighbour open:
 *
 *   - Only single-quoted values were visible, and `parseInt` returns NaN for
 *     anything non-numeric, so `NaN < 22` was false and it PASSED. Measured:
 *     `'lts/iron'` (Node 20) passed; `'${{ matrix.node }}'` over a `[20]`
 *     matrix passed; and — the one that matters — three good jobs plus a
 *     FOURTH job running `npm test` on a bare `node-version: 20` passed,
 *     because the floor was `pinned.length >= 3` and there were three.
 *     A floor equal to today's count demands THAT COUNT, not coverage.
 *   - The floor itself was wrong. `node:sqlite` landed in 22.5 behind
 *     `--experimental-sqlite` and was UNFLAGGED in 22.13.0 (nodejs/node#55890).
 *     Measured, real binaries: 22.5.1 … 22.12.0 all throw
 *     ERR_UNKNOWN_BUILTIN_MODULE; 22.13.0 and up are fine. So `'22.12.0'`
 *     passed a major-only comparison while leaving 56 tests failing — and
 *     `engines: '>=22'` told a developer on 22.12 that they were supported.
 *
 * So this draft parses the workflow's STRUCTURE instead of grepping it, reads
 * every file in `.github/workflows/`, correlates each job that runs node/npm
 * with the pin that job actually declares, and compares whole versions. A form
 * it cannot read is REPORTED rather than skipped (R9-67's discipline): an
 * unreadable pin makes every comparison below weaker, so it fails here, loudly,
 * and the scanner gets taught. Never the reverse.
 *
 * Deriving the floor's REASON from the code is still the point: the day nothing
 * requires `node:sqlite` any more, the last case here fails and says the floor
 * can be lowered, rather than quietly outliving its reason.
 */
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.join(__dirname, '..');
const WORKFLOW_DIR = path.join(REPO_ROOT, '.github', 'workflows');
const SCRIPTS_DIR = path.join(REPO_ROOT, 'scripts');

/**
 * The oldest Node this repo's own tooling can run on, as a WHOLE version.
 *
 * Not a major: `node:sqlite` exists from 22.5 but throws without
 * `--experimental-sqlite` until 22.13.0, so the major alone cannot express the
 * floor. Verified by calling `require('node:sqlite')` on real binaries, one per
 * minor, and by running the full suite under 22.23.2 and 24.11.1.
 */
const MINIMUM_NODE = '22.13.0';

type Version = [number, number, number];

/** `'22.13.0'` / `'22.13'` / `'22'` -> a triple, or null if it is not numeric. */
function parseVersion(value: string): {version: Version; parts: number} | null {
  const trimmed = value.trim().replace(/^v/, '');
  if (!/^\d+(\.\d+){0,2}$/.test(trimmed)) return null;
  const parts = trimmed.split('.').map(n => parseInt(n, 10));
  return {
    version: [parts[0], parts[1] ?? 0, parts[2] ?? 0],
    parts: parts.length,
  };
}

function compare(a: Version, b: Version): number {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

/**
 * Why this pin cannot be trusted to satisfy the floor, or null if it can.
 *
 * A bare major equal to the floor's major is REFUSED on purpose. `setup-node`
 * resolves `'22'` to the newest 22.x available to it, which happens to satisfy
 * 22.13.0 today — but the string does not say so, and the whole reason this
 * file exists is that "it happens to be fine today" is a note, not a gate.
 * `'22.13'` or `'24'` say it.
 */
function whyInsufficient(pin: string): string | null {
  const floor = parseVersion(MINIMUM_NODE)!.version;
  const parsed = parseVersion(pin);
  if (!parsed) {
    return 'not a numeric version (a range, alias or expression cannot be checked)';
  }
  if (parsed.parts === 1) {
    if (parsed.version[0] > floor[0]) return null;
    return (
      'a bare major cannot be shown to reach ' +
      MINIMUM_NODE +
      "; write at least '" +
      floor[0] +
      '.' +
      floor[1] +
      "'"
    );
  }
  return compare(parsed.version, floor) >= 0
    ? null
    : 'below the floor ' + MINIMUM_NODE;
}

interface NodePin {
  job: string;
  /** The value as written, quotes stripped. */
  pin: string;
  /** Which key it came from, so a message can name it. */
  key: string;
}

interface WorkflowScan {
  /** Jobs whose steps run node/npm/npx/yarn, so they NEED a pinned Node. */
  jobsRunningNode: string[];
  /** One entry per readable `node-version` key. */
  pins: NodePin[];
  /** Forms this scanner cannot turn into a version — never silently dropped. */
  unreadable: string[];
}

/** Strip a trailing `# comment` that is not inside quotes, then the quotes. */
function scalar(raw: string): string {
  let value = raw.trim();
  let quote: string | null = null;
  let end = value.length;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
    } else if (ch === '#' && (i === 0 || /\s/.test(value[i - 1]))) {
      end = i;
      break;
    }
  }
  value = value.slice(0, end).trim();
  if (value.length >= 2 && /^['"]/.test(value) && value.at(-1) === value[0]) {
    value = value.slice(1, -1);
  }
  return value;
}

const indentOf = (line: string): number =>
  line.length - line.trimStart().length;
const isBlank = (line: string): boolean => /^\s*(#.*)?$/.test(line);

/**
 * The scanner, over SOURCE TEXT rather than a path — the shape R9-86 settled on
 * for this repo, so the probe cases below exercise THIS function and not a copy
 * of it.
 *
 * It is not a general YAML parser. It reads the one structure GitHub Actions
 * workflows have: `jobs:` at column 0, job names two spaces in, steps as `- `
 * sequences under them. Anything it meets inside that structure and cannot
 * interpret goes into `unreadable` rather than being skipped.
 */
export function scanWorkflowSource(name: string, source: string): WorkflowScan {
  const lines = source.split(/\r?\n/);
  const scan: WorkflowScan = {jobsRunningNode: [], pins: [], unreadable: []};

  let inJobs = false;
  let job: string | null = null;
  let jobIndent = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (isBlank(line)) continue;
    const indent = indentOf(line);
    const text = line.trim();

    if (!inJobs) {
      if (indent === 0 && /^jobs:\s*$/.test(text)) inJobs = true;
      continue;
    }
    if (indent === 0) {
      // Left the `jobs:` mapping entirely (another top-level key).
      inJobs = false;
      job = null;
      continue;
    }

    const jobHeader = text.match(/^([A-Za-z_][\w-]*):\s*$/);
    if (jobHeader && (job === null || indent <= jobIndent)) {
      job = jobHeader[1];
      jobIndent = indent;
      continue;
    }
    if (job === null) continue;

    // Does this job run node/npm at all? Both `run: cmd` and `run: |` blocks.
    const run = text.match(/^-?\s*run:\s*(.*)$/);
    if (run) {
      let command = run[1];
      if (/^[|>]/.test(command.trim())) {
        command = '';
        for (let j = i + 1; j < lines.length; j += 1) {
          if (isBlank(lines[j])) continue;
          if (indentOf(lines[j]) <= indent) break;
          command += lines[j] + '\n';
        }
      }
      if (
        /\b(npm|npx|node|yarn|pnpm)\b/.test(command) &&
        !scan.jobsRunningNode.includes(job)
      ) {
        scan.jobsRunningNode.push(job);
      }
      continue;
    }

    const versionKey = text.match(/^(node-version|node-version-file):\s*(.*)$/);
    if (versionKey) {
      const key = versionKey[1];
      const raw = scalar(versionKey[2]);
      if (raw === '') {
        scan.unreadable.push(name + ' ' + job + ': empty ' + key);
      } else if (raw.includes('${{')) {
        scan.unreadable.push(
          name +
            ' ' +
            job +
            ': ' +
            key +
            ' is the expression ' +
            raw +
            ', whose value this scanner cannot resolve (a matrix or an input)',
        );
      } else if (key === 'node-version-file') {
        // Legitimate, and readable: the file it names lives in the repo.
        const target = path.join(REPO_ROOT, raw);
        if (!fs.existsSync(target)) {
          scan.unreadable.push(
            name +
              ' ' +
              job +
              ': node-version-file points at ' +
              raw +
              ', which is not in the repo',
          );
        } else {
          scan.pins.push({
            job,
            pin: fs.readFileSync(target, 'utf8').trim(),
            key: key + ' (' + raw + ')',
          });
        }
      } else {
        scan.pins.push({job, pin: raw, key});
      }
    }
  }
  return scan;
}

function workflowFiles(): string[] {
  return fs
    .readdirSync(WORKFLOW_DIR)
    .filter(name => /\.ya?ml$/.test(name))
    .map(name => path.join(WORKFLOW_DIR, name))
    .sort();
}

function scanEveryWorkflow(): Array<{file: string; scan: WorkflowScan}> {
  return workflowFiles().map(file => ({
    file: path.basename(file),
    scan: scanWorkflowSource(
      path.basename(file),
      fs.readFileSync(file, 'utf8'),
    ),
  }));
}

describe('the workflow scanner itself (probes, not the real workflow)', () => {
  // R9-86's lesson, applied at birth: the cases below call the SAME function
  // the repo-wide assertions call. A test of a copy protects nothing.
  const job = (body: string): string =>
    'name: CI\non: [push]\njobs:\n  build:\n' + body;
  const withPin = (value: string): string =>
    job(
      '    steps:\n      - uses: actions/setup-node@v4\n        with:\n          node-version: ' +
        value +
        '\n',
    );

  it('reads a single-quoted pin', () => {
    const scan = scanWorkflowSource('probe.yml', withPin("'24'"));
    expect(scan.pins).toEqual([{job: 'build', pin: '24', key: 'node-version'}]);
    expect(scan.unreadable).toEqual([]);
  });

  it('reads a DOUBLE-quoted pin, which the old regex could not see', () => {
    const scan = scanWorkflowSource('probe.yml', withPin('"20"'));
    expect(scan.pins).toEqual([{job: 'build', pin: '20', key: 'node-version'}]);
  });

  it('reads an UNQUOTED pin, which the old regex could not see', () => {
    const scan = scanWorkflowSource('probe.yml', withPin('20'));
    expect(scan.pins).toEqual([{job: 'build', pin: '20', key: 'node-version'}]);
  });

  it('strips a trailing comment but keeps a # inside quotes', () => {
    const scan = scanWorkflowSource(
      'probe.yml',
      withPin("'24' # keep in step with engines"),
    );
    expect(scan.pins[0].pin).toBe('24');
  });

  it('REPORTS a matrix expression instead of dropping it', () => {
    // The old regex matched this and handed `parseInt` a string that became
    // NaN, so `NaN < 22` was false and a `[20]` matrix passed.
    const scan = scanWorkflowSource(
      'probe.yml',
      withPin("'${{ matrix.node }}'"),
    );
    expect(scan.pins).toEqual([]);
    expect(scan.unreadable).toHaveLength(1);
    expect(scan.unreadable[0]).toMatch(/cannot resolve/);
  });

  it('REPORTS a node-version-file that is not in the repo', () => {
    const scan = scanWorkflowSource(
      'probe.yml',
      job(
        "    steps:\n      - uses: actions/setup-node@v4\n        with:\n          node-version-file: '.nvmrc'\n",
      ),
    );
    expect(scan.pins).toEqual([]);
    expect(scan.unreadable[0]).toMatch(/not in the repo/);
  });

  it('notices which jobs run node, including inside a `run: |` block', () => {
    const scan = scanWorkflowSource(
      'probe.yml',
      'name: CI\non: [push]\njobs:\n' +
        '  docs:\n    steps:\n      - run: echo hello\n' +
        '  test:\n    steps:\n      - run: |\n          npm ci\n          npm test\n',
    );
    expect(scan.jobsRunningNode).toEqual(['test']);
  });

  it('attributes every pin to ITS OWN job', () => {
    // The correlation the old floor could not do: a count cannot tell you
    // WHICH job is unpinned. This is R9-89 in one probe.
    const scan = scanWorkflowSource(
      'probe.yml',
      'name: CI\non: [push]\njobs:\n' +
        "  a:\n    steps:\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '24'\n      - run: npm test\n" +
        '  b:\n    steps:\n      - run: npm test\n',
    );
    expect(scan.pins).toEqual([{job: 'a', pin: '24', key: 'node-version'}]);
    expect(scan.jobsRunningNode).toEqual(['a', 'b']);
  });
});

describe('the version floor', () => {
  it('accepts what is new enough and NAMES what is not', () => {
    expect(whyInsufficient('24')).toBeNull();
    expect(whyInsufficient('22.13.0')).toBeNull();
    expect(whyInsufficient('22.13')).toBeNull();
    expect(whyInsufficient('23.4.0')).toBeNull();
    // The measured gap: node:sqlite exists here but throws without the flag.
    expect(whyInsufficient('22.12.0')).toMatch(/below the floor/);
    expect(whyInsufficient('20')).toMatch(/bare major/);
    // Same major as the floor says nothing about reaching 22.13.0.
    expect(whyInsufficient('22')).toMatch(/bare major/);
    // What `parseInt` turned into NaN, and NaN into a pass.
    expect(whyInsufficient('lts/iron')).toMatch(/not a numeric version/);
    expect(whyInsufficient('lts/*')).toMatch(/not a numeric version/);
  });
});

describe('CI runs a Node new enough to load every test suite', () => {
  it('finds workflows, and every one of them parses (the floor)', () => {
    // Without this, a renamed directory or a reformatted file would make every
    // loop below iterate over nothing and report success — the exact vacuum
    // R9-66 and R9-77 were both about.
    expect(workflowFiles().length).toBeGreaterThanOrEqual(1);
    const scans = scanEveryWorkflow();
    expect(scans.flatMap(s => s.scan.unreadable)).toEqual([]);
    // And at least one job that actually runs node, or this gate is watching a
    // file that no longer decides anything.
    expect(
      scans.flatMap(s => s.scan.jobsRunningNode).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('pins a Node for EVERY job that runs node or npm', () => {
    // R9-89. The old floor was `>= 3 pins` — exactly the number of jobs there
    // were — so it demanded three pins rather than demanding that every job
    // have one. A fourth job running `npm test` on Node 20 passed it.
    const unpinned: string[] = [];
    for (const {file, scan} of scanEveryWorkflow()) {
      for (const job of scan.jobsRunningNode) {
        if (!scan.pins.some(pin => pin.job === job)) {
          unpinned.push(file + ' ' + job);
        }
      }
    }
    expect(unpinned).toEqual([]);
  });

  it('never pins one below what the repo needs', () => {
    // The finding. `'20'` here is not a slower CI or a style choice: it is two
    // whole suites that never run, reported as one line in a job log nobody
    // reads twice.
    const tooOld: string[] = [];
    for (const {file, scan} of scanEveryWorkflow()) {
      for (const pin of scan.pins) {
        const why = whyInsufficient(pin.pin);
        if (why) {
          tooOld.push(
            file + ' ' + pin.job + ' ' + pin.key + '=' + pin.pin + ': ' + why,
          );
        }
      }
    }
    expect(tooOld).toEqual([]);
  });

  it('declares a floor at least as high in package.json engines', () => {
    // Two places that must agree. R9-88: this used to be `toBe('>=22')` —
    // string equality, which never asks whether the floor is high ENOUGH. It
    // made `'>=22'` mandatory and REFUSED the correction, so writing the true
    // floor failed the very gate that exists to protect it.
    const pkg = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'),
    );
    const declared: string = pkg.engines?.node ?? '';
    const match = declared.match(/^>=\s*(\d+(?:\.\d+){0,2})$/);
    expect([declared, Boolean(match)]).toEqual([declared, true]);
    expect([declared, whyInsufficient(match![1])]).toEqual([declared, null]);
  });

  it('no other suite still CLAIMS CI pins something older', () => {
    // R9-91. Five suites carried, in prose, "this repo's CI pins Node 20" as
    // the documented REASON they simulate SQL by hand instead of opening
    // node:sqlite. That reason expired the moment R9-82 moved CI to 24, and
    // nothing noticed, because a comment is not a gate: it is a note, and a
    // note cannot go red.
    //
    // This is the note turned into a detector. It only understands the
    // present-tense phrasing this repo actually used ("pins Node 20", "pins
    // `node-version: 20`"); a sentence worded some other way still escapes it,
    // which is why the claims were rewritten in the PAST tense rather than
    // merely renumbered. What it does guarantee is that the specific form that
    // rotted here cannot rot again silently.
    const realPins = new Set(
      scanEveryWorkflow().flatMap(entry => entry.scan.pins.map(pin => pin.pin)),
    );
    const stale: string[] = [];
    for (const name of fs.readdirSync(__dirname)) {
      // This file has to QUOTE the bad phrasing in order to document it, so
      // it is the one file that cannot be measured by its own rule.
      if (name === path.basename(__filename)) continue;
      if (!/\.tsx?$|\.jsx?$/.test(name)) continue;
      const source = fs.readFileSync(path.join(__dirname, name), 'utf8');
      for (const match of source.matchAll(
        /\bpins\b[^.\n]{0,40}?(?:`?[Nn]ode-version`?:?\s*|[Nn]ode\s+)['"`]?(\d+(?:\.\d+){0,2})/g,
      )) {
        if (!realPins.has(match[1])) {
          stale.push(name + ': claims CI pins ' + match[1]);
        }
      }
    }
    expect(stale).toEqual([]);
  });

  it('still has a reason to require it (guards against a stale floor)', () => {
    // The other direction, and the reason the constant above is allowed to be
    // a constant: it exists because something in this repo really does need
    // node:sqlite. R9-90: DERIVED across every script, not asserted about one
    // file — the old version read build-web-packs.js alone and matched its
    // TEXT, so it stayed green on a mention in a COMMENT after a migration off
    // node:sqlite, and in the other direction it would have said the floor was
    // stale while eight other scripts still required the module.
    const stripComments = (source: string): string =>
      source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
    const requiring = fs
      .readdirSync(SCRIPTS_DIR, {recursive: true, withFileTypes: true})
      .filter(entry => entry.isFile() && /\.[cm]?js$/.test(entry.name))
      .map(entry => path.join(entry.parentPath, entry.name))
      .filter(file =>
        /require\(\s*['"]node:sqlite['"]\s*\)/.test(
          stripComments(fs.readFileSync(file, 'utf8')),
        ),
      )
      .map(file => path.relative(REPO_ROOT, file).replace(/\\/g, '/'));

    expect(requiring).toContain('scripts/build-web-packs.js');
    // The floor is not held up by one script. Say how many, so the day this
    // reaches zero the message is "lower the floor", not "fix the test".
    expect(requiring.length).toBeGreaterThanOrEqual(2);
  });
});
