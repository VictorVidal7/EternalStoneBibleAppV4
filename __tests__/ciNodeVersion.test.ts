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
 *
 * The node environment, because jest-expo resolves packages with browser
 * conditions and `yaml` (R9-107) would load as its ESM browser build.
 *
 * @jest-environment node
 */
import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';

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
  /**
   * Every job id found under `jobs:`.
   *
   * R9-100: this exists so a file the scanner understood NOTHING in cannot look
   * like a file with nothing to say. The repo-wide floor used to be a count of
   * node-running jobs taken across ALL workflow files, so one blinded file was
   * covered by its neighbours — today's number standing in for coverage, one
   * more time.
   */
  jobs: string[];
  /** Jobs whose steps run node/npm/npx/yarn, so they NEED a pinned Node. */
  jobsRunningNode: string[];
  /** One entry per readable `node-version` key. */
  pins: NodePin[];
  /** Forms this scanner cannot turn into a version — never silently dropped. */
  unreadable: string[];
}

/** A YAML mapping, as opposed to a sequence, a scalar or nothing. */
const isMap = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The tools that mean a step needs a pinned Node. */
const RUNS_NODE = /\b(npm|npx|node|yarn|pnpm)\b/;

/**
 * The scanner, over SOURCE TEXT rather than a path — the shape R9-86 settled on
 * for this repo, so the probe cases below exercise THIS function and not a copy
 * of it.
 *
 * R9-107: it reads the workflow with a real YAML parser and walks
 * `jobs.*.steps[*]` as DATA. The drafts before it read LINES, and every fix
 * they got was a fix to one more line shape:
 *
 *   - R9-99: a job header was a line ending at its colon, so `bad: # comment`
 *     folded that job into the one above it, pin included.
 *   - R9-100: `jobs: # comment` blinded the whole file.
 *   - R9-107: "this job runs npm" was `/^-?\s*run:\s*(.*)$/`, the command on
 *     the SAME line. A `run:` whose value sits on the next line (the form of
 *     actions/starter-workflows' rust-clippy.yml), a quoted key, a flow-style
 *     step, a multi-line scalar or an aliased step all left a job running
 *     `npm test` with no setup-node out of `jobsRunningNode`, so nothing
 *     demanded a pin for it: 23/23 green on the real ci.yml plus that job.
 *
 * Deciding by the form of a line is deciding by a style. A parser has no style
 * to miss: whatever GitHub reads as `run`, this reads as `run`.
 *
 * Two parser settings are deliberate:
 *
 *   - `schema: 'failsafe'`: every scalar stays the TEXT it was written as. The
 *     default schema turns an unquoted `22.10` into the float 22.1, which
 *     would then compare as 22.1.0: a wrong version, silently.
 *   - `merge: true`: a `<<:` key is followed, so steps a job inherits are seen.
 *     Reading more than GitHub would is the safe side for a gate that asks
 *     which jobs run node.
 *
 * What it cannot turn into data is REPORTED in `unreadable` (R9-67's
 * discipline): a file that is not valid YAML, a job or a step that is not a
 * mapping, a `with:` that is not one, a pin that is not a scalar. Teach the
 * scanner, never the reverse.
 */
export function scanWorkflowSource(name: string, source: string): WorkflowScan {
  const scan: WorkflowScan = {
    jobs: [],
    jobsRunningNode: [],
    pins: [],
    unreadable: [],
  };

  let root: unknown;
  try {
    const doc = YAML.parseDocument(source, {schema: 'failsafe', merge: true});
    if (doc.errors.length > 0) {
      throw new Error(doc.errors.map(error => error.message).join('; '));
    }
    root = doc.toJS({maxAliasCount: 100});
  } catch (error) {
    const message = (error as Error).message.split('\n')[0];
    scan.unreadable.push(name + ': not valid YAML (' + message + ')');
    return scan;
  }

  // No `jobs:` at all yields no jobs, and the per-file floor below says so.
  if (!isMap(root) || root.jobs === undefined) return scan;
  if (!isMap(root.jobs)) {
    scan.unreadable.push(name + ': jobs is not a mapping');
    return scan;
  }

  for (const [job, body] of Object.entries(root.jobs)) {
    scan.jobs.push(job);
    if (!isMap(body)) {
      scan.unreadable.push(name + ': job ' + job + ' is not a mapping');
      continue;
    }
    // A job that calls a reusable workflow (`uses:`) has no steps of its own.
    if (body.steps === undefined) continue;
    if (!Array.isArray(body.steps)) {
      scan.unreadable.push(name + ' ' + job + ': steps is not a sequence');
      continue;
    }

    body.steps.forEach((step: unknown, index: number) => {
      const where = name + ' ' + job + ': step ' + (index + 1);
      if (!isMap(step)) {
        scan.unreadable.push(where + ' is not a mapping');
        return;
      }
      if (
        step.run !== undefined &&
        RUNS_NODE.test(String(step.run)) &&
        !scan.jobsRunningNode.includes(job)
      ) {
        scan.jobsRunningNode.push(job);
      }

      if (step.with === undefined) return;
      if (!isMap(step.with)) {
        scan.unreadable.push(where + ': with is not a mapping');
        return;
      }
      for (const key of ['node-version', 'node-version-file']) {
        if (!(key in step.with)) continue;
        const value = step.with[key];
        if (value !== null && typeof value !== 'string') {
          scan.unreadable.push(where + ': ' + key + ' is not a scalar');
          continue;
        }
        const raw = (value ?? '').trim();
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
    });
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

  it('reads a `jobs:` key that carries a trailing comment', () => {
    // R9-100. `/^jobs:\s*$/` refused this, `inJobs` never turned on, and the
    // whole file came back empty — a silence indistinguishable from a clean
    // parse. Measured with a real second workflow file: a `publish` job
    // running `npm ci && npm run build:web` on `node-version: '20'` — R9-82
    // verbatim — passed this suite 15/15, because the only floor was a count
    // of node-running jobs ACROSS ALL FILES, and ci.yml satisfied it on the
    // blinded file's behalf. Deleting the comment alone turned it red.
    const scan = scanWorkflowSource(
      'probe.yml',
      'name: CI\non: [push]\njobs: # the three jobs\n' +
        "  test:\n    steps:\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '20'\n      - run: npm test\n",
    );
    expect(scan.jobs).toEqual(['test']);
    expect(scan.pins).toEqual([{job: 'test', pin: '20', key: 'node-version'}]);
  });

  it('gives a job whose header carries a trailing comment its OWN identity', () => {
    // R9-99, and it is R9-89's case walking back in through another door. The
    // job-header pattern demanded the line END at the colon, so `bad:` below
    // did not match it, `job` stayed on `good`, and every step underneath was
    // filed under a job that IS pinned. Measured against the real ci.yml: a
    // fourth job running `npm ci && npm test` with no setup-node step at all
    // passed 15/15; deleting the comment alone turned it red.
    const scan = scanWorkflowSource(
      'probe.yml',
      'name: CI\non: [push]\njobs:\n' +
        "  good:\n    steps:\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '24'\n      - run: npm test\n" +
        '  bad: # added in a hurry\n    steps:\n      - run: npm test\n',
    );
    expect(scan.jobs).toEqual(['good', 'bad']);
    expect(scan.jobsRunningNode).toEqual(['good', 'bad']);
    expect(scan.pins).toEqual([{job: 'good', pin: '24', key: 'node-version'}]);
  });

  it('REPORTS a merge key it cannot resolve instead of adopting the last job', () => {
    // The general form of R9-99: whatever the reason a job cannot be read, the
    // steps under it must not silently inherit the previous job's pin. Under
    // the line scanner this `<<:` was "a job name it cannot read"; under the
    // parser (R9-107) an alias to an anchor that does not exist makes the
    // whole file unreadable, which is louder still: it is reported, and it
    // yields no jobs, so the per-file floor fails too.
    const scan = scanWorkflowSource(
      'probe.yml',
      'name: CI\non: [push]\njobs:\n' +
        "  good:\n    steps:\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '24'\n      - run: npm test\n" +
        '  <<: *shared\n    steps:\n      - run: npm test\n',
    );
    expect(scan.unreadable).toHaveLength(1);
    expect(scan.unreadable[0]).toMatch(/not valid YAML/);
    expect(scan.jobs).toEqual([]);
  });

  it('follows a merge key it CAN resolve, so inherited steps are seen', () => {
    const scan = scanWorkflowSource(
      'probe.yml',
      'name: CI\non: [push]\nx-shared: &shared\n  steps:\n    - run: npm test\njobs:\n' +
        "  good:\n    steps:\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '24'\n      - run: npm test\n" +
        '  inherits:\n    <<: *shared\n    runs-on: ubuntu-latest\n',
    );
    expect(scan.unreadable).toEqual([]);
    expect(scan.jobsRunningNode).toEqual(['good', 'inherits']);
    expect(scan.pins).toEqual([{job: 'good', pin: '24', key: 'node-version'}]);
  });

  it('yields NO jobs for a file it could not read at all', () => {
    // What makes the per-file floor below mean anything: a file this scanner
    // does not understand has to come back EMPTY, so "every workflow file
    // declares at least one job" can see it. A count taken across all files
    // cannot — that is exactly how the blinded second workflow hid.
    const scan = scanWorkflowSource(
      'probe.yml',
      'name: Deploy\non: [push]\nsteps:\n  - run: npm ci\n',
    );
    expect(scan.jobs).toEqual([]);
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

describe('R9-107: which job runs node is read from the DATA, not the line shape', () => {
  // The scanner used to decide "this job runs npm" with `/^-?\s*run:\s*(.*)$/`,
  // the command on the SAME line. Every form below is valid YAML that GitHub
  // runs, and in each one a job running `npm test` with no setup-node step at
  // all was never entered in `jobsRunningNode`, so nothing demanded a pin for
  // it. Measured on the real ci.yml with a fourth job: 23/23 green. The first
  // form is not exotic: it is how actions/starter-workflows'
  // code-scanning/rust-clippy.yml writes its `run:`.
  const smoke = (jobBody: string): string =>
    'name: CI\non: [push]\njobs:\n' +
    "  lint:\n    steps:\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '24'\n      - &npmtest {run: npm test}\n" +
    jobBody;
  const forms: Array<[string, string]> = [
    [
      'the value on the NEXT line',
      '  smoke:\n    steps:\n      - run:\n          npm test\n',
    ],
    [
      'the value on the next line, under `- name:`',
      '  smoke:\n    steps:\n      - name: Test\n        run:\n          npm test\n',
    ],
    [
      'a plain scalar over two lines, npm on the second',
      '  smoke:\n    steps:\n      - run: echo start &&\n          npm test\n',
    ],
    [
      'a double-quoted scalar over two lines',
      '  smoke:\n    steps:\n      - run: "echo start &&\n          npm test"\n',
    ],
    [
      'a single-quoted scalar over two lines',
      "  smoke:\n    steps:\n      - run: 'echo start &&\n          npm test'\n",
    ],
    ['a double-quoted key', '  smoke:\n    steps:\n      - "run": npm test\n'],
    ['a single-quoted key', "  smoke:\n    steps:\n      - 'run': npm test\n"],
    [
      'a space before the colon',
      '  smoke:\n    steps:\n      - run : npm test\n',
    ],
    ['a flow-mapping step', '  smoke:\n    steps:\n      - {run: npm test}\n'],
    ['a flow-sequence of steps', '  smoke:\n    steps: [{run: npm test}]\n'],
    [
      'the whole job in flow style',
      '  smoke: {runs-on: ubuntu-latest, steps: [{run: npm test}]}\n',
    ],
    ['a step that is an alias', '  smoke:\n    steps:\n      - *npmtest\n'],
  ];

  it.each(forms)('sees npm in %s, and that it has no pin', (_label, body) => {
    const scan = scanWorkflowSource('probe.yml', smoke(body));
    expect(scan.unreadable).toEqual([]);
    expect(scan.jobs).toEqual(['lint', 'smoke']);
    expect(scan.jobsRunningNode).toEqual(['lint', 'smoke']);
    expect(scan.pins).toEqual([{job: 'lint', pin: '24', key: 'node-version'}]);
  });

  it('flags an unpinned fourth job appended to the REAL ci.yml', () => {
    const real = fs.readFileSync(path.join(WORKFLOW_DIR, 'ci.yml'), 'utf8');
    const scan = scanWorkflowSource(
      'ci.yml',
      real.replace(/\s*$/, '\n') +
        '\n  smoke:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run:\n          npm ci && npm test\n',
    );
    expect(scan.unreadable).toEqual([]);
    expect(
      scan.jobsRunningNode.filter(
        job => !scan.pins.some(pin => pin.job === job),
      ),
    ).toEqual(['smoke']);
  });

  it('keeps an unquoted pin as WRITTEN (22.10 is not the number 22.1)', () => {
    // A parser's default schema turns `22.10` into the float 22.1, which would
    // compare as 22.1.0 — the wrong version, silently. The failsafe schema
    // keeps every scalar as the text it was.
    const scan = scanWorkflowSource(
      'probe.yml',
      'name: CI\non: [push]\njobs:\n  a:\n    steps:\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22.10\n      - run: npm test\n',
    );
    expect(scan.pins).toEqual([{job: 'a', pin: '22.10', key: 'node-version'}]);
  });

  it('REPORTS a file that is not valid YAML instead of reading what it can', () => {
    const scan = scanWorkflowSource(
      'probe.yml',
      'name: CI\non: [push]\njobs:\n  a:\n    steps: [\n',
    );
    expect(scan.jobs).toEqual([]);
    expect(scan.unreadable).toHaveLength(1);
    expect(scan.unreadable[0]).toMatch(/not valid YAML/);
  });

  it('REPORTS a step or job that is not a mapping', () => {
    const scan = scanWorkflowSource(
      'probe.yml',
      'name: CI\non: [push]\njobs:\n  a:\n    steps:\n      - npm test\n  b: npm test\n',
    );
    expect(scan.unreadable).toEqual([
      'probe.yml a: step 1 is not a mapping',
      'probe.yml: job b is not a mapping',
    ]);
  });
});

/**
 * Every Node version a piece of prose CLAIMS this repo's CI pins, in order.
 *
 * R9-101, two halves. It is a function over source TEXT so the probes below can
 * exercise the real matcher (R9-86's shape) — before that, the only thing
 * calling it was a loop over the repo, and since the five sentences it was
 * written for had all been rewritten in the same commit, that loop matched
 * NOTHING anywhere: ~360 files, zero comparisons, green. A regex that had
 * stopped working entirely looked identical.
 *
 * And it flattens block-comment continuations before matching, because the
 * sentence that rotted WRAPPED:
 *
 *     ... but this repo's CI (.github/workflows/ci.yml) pins
 *     `node-version: 20`, and `node:sqlite` requires Node >= 22.5 ...
 *
 * `[^.\n]` between "pins" and the version made that invisible, so the detector
 * could not see the canonical instance — the header in
 * databaseMigrations.test.ts that the other four cite as their reason. Measured
 * by restoring that exact sentence to the real file: still green. Prettier
 * wraps these blocks at 80 columns, so a claim that survives a wrap is the
 * ordinary claim, not the exotic one.
 *
 * It still only understands a PRESENT-TENSE assertion naming Node or
 * `node-version`, which is the form this repo actually used; a sentence worded
 * some other way escapes it, and that is why the five were rewritten in the
 * past tense rather than merely renumbered. What it guarantees is that the
 * specific form that rotted here cannot rot again in silence.
 */
export function nodePinClaims(source: string): string[] {
  const prose = source.replace(/^[ \t]*\*[ \t]?/gm, '').replace(/\r?\n/g, ' ');
  return [
    ...prose.matchAll(
      /\bpins\b[^.\n]{0,40}?(?:`?[Nn]ode-version`?:?\s*|[Nn]ode\s+)['"`]?(\d+(?:\.\d+){0,2})/g,
    ),
  ].map(match => match[1]);
}

describe('the stale-claim detector itself (probes, not the repo)', () => {
  // R9-101. Until these existed the detector had no positive case anywhere:
  // the five sentences it was written for had all been rewritten in the same
  // commit, so it matched NOTHING in the whole repo and its loop ran ~360
  // times without once reaching the comparison. A regex that had stopped
  // working altogether would have looked exactly the same. That is the shape
  // session 13 named — a check whose whole body is a loop passes on an empty
  // one — inside a gate written in session 17 to stop prose from rotting.
  it('sees a claim that WRAPS across a line', () => {
    // Verbatim from databaseMigrations.test.ts as it stood before R9-91 - the
    // CANONICAL one, the header the other four cite as their reason. Prettier
    // wraps these blocks at 80 columns, so wrapping is the ordinary case, and
    // `[^.\n]` made the ordinary case invisible: measured by restoring this
    // sentence to the real file, where the gate stayed green.
    const source =
      " * A REAL SQLite engine was evaluated for this (Node's built-in\n" +
      " * `node:sqlite`), but this repo's CI (.github/workflows/ci.yml) pins\n" +
      ' * `node-version: 20`, and `node:sqlite` requires Node >= 22.5 — it would\n' +
      ' * have passed locally while breaking CI.\n';
    expect(nodePinClaims(source)).toEqual(['20']);
  });

  it('sees the single-line form as well', () => {
    expect(
      nodePinClaims(
        " * scripts/*.js use), but this repo's CI pins Node 20 and\n",
      ),
    ).toEqual(['20']);
  });

  it('reads the version out of the CURRENT wording, so it stays a live claim', () => {
    // The corrected sentences are not decoration: they name a version, so they
    // are checked against the real workflow like any other claim. The day CI
    // moves off 24 they go red instead of quietly becoming wrong.
    expect(
      nodePinClaims(' * (R9-91: it pins Node 24 now) and `node:sqlite`\n'),
    ).toEqual(['24']);
  });

  it('does NOT flag a sentence written in the PAST tense (the control)', () => {
    // Without this a detector that matched everything would satisfy all three
    // cases above, and every honest historical note in the repo would be a
    // failure.
    const source =
      " * but this repo's CI (.github/workflows/ci.yml) pinned\n" +
      ' * `node-version: 20` AT THE TIME, and `node:sqlite` is unusable\n';
    expect(nodePinClaims(source)).toEqual([]);
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

    // R9-100: PER FILE, not across all of them. Every GitHub workflow declares
    // at least one job, so a file this scanner got nothing out of is a file it
    // failed to read — and the previous floor could not tell those apart,
    // because it counted node-running jobs over the whole directory and any
    // one healthy file satisfied it for all the others. Measured: a second
    // workflow whose `jobs:` key carried a trailing comment, running
    // `npm ci && npm run build:web` on Node 20, passed this suite 15/15.
    for (const {file, scan} of scans) {
      expect([file, scan.jobs.length > 0]).toEqual([file, true]);
    }

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
    // This is the note turned into a detector. What it does and does not
    // understand is written on nodePinClaims, and the probes above are what
    // prove it understands any of it — R9-101: when this test was written, the
    // five sentences had already been rewritten, so it matched nothing in the
    // repo and passed on an empty loop.
    //
    // R9-101 also turned the three corrected sentences back into live claims
    // ("it pins Node 24 now" rather than "it pins 24 now"), so they are checked
    // against the real workflow like everything else and go red the day CI
    // moves off 24, instead of quietly becoming wrong again.
    const realPins = new Set(
      scanEveryWorkflow().flatMap(entry => entry.scan.pins.map(pin => pin.pin)),
    );
    const stale: string[] = [];
    let checked = 0;
    for (const entry of fs.readdirSync(__dirname, {recursive: true})) {
      const name = String(entry);
      // This file has to QUOTE the bad phrasing in order to document it, so
      // it is the one file that cannot be measured by its own rule.
      if (path.basename(name) === path.basename(__filename)) continue;
      if (!/\.tsx?$|\.jsx?$/.test(name)) continue;
      const source = fs.readFileSync(path.join(__dirname, name), 'utf8');
      for (const claimed of nodePinClaims(source)) {
        checked += 1;
        if (!realPins.has(claimed)) {
          stale.push(name + ': claims CI pins ' + claimed);
        }
      }
    }
    expect(stale).toEqual([]);
    // Floor: the loop above has to have REACHED the comparison. Zero claims
    // anywhere is what "the regex broke" looks like, and it is also what this
    // check looked like for its whole first day alive.
    expect(checked).toBeGreaterThanOrEqual(1);
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
