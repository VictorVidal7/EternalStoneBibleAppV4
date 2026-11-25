/**
 * R9-5 and R9-6 — what the CI workflow PROMISES, read as data.
 *
 * R9-5: the job was called "Security Audit", and both of its checks carried
 * `continue-on-error: true`, so it came back green on every run while
 * `npm audit --audit-level=moderate` exited 1 (measured in session 178: 62
 * advisories, 2 critical; 28 even with --omit=dev, which in Expo still counts
 * the CLI and the dev server).
 * Someone reading a PR's checks concluded "the security audit passed". The
 * audit cannot gate today without a remediation pass of its own (R9-1), so the
 * fix is the other option the entry gave: the name stops promising a guarantee
 * the job does not give. The rule below is general: a step that cannot fail
 * says it only REPORTS, and so does the job that holds it.
 *
 * R9-6: the workflow declared no `permissions:`, so the token inherited the
 * repo default (read today, but that is a setting anyone can flip in the UI
 * with no trace in git), and the Codecov action ran from the movable tag
 * `@v4`. Now the workflow asks for read-only contents, and every action not
 * published by GitHub itself is pinned to a full commit sha.
 *
 * The checks are functions over SOURCE TEXT (R9-86's shape), so the probes
 * exercise the same code the repo-wide assertions run.
 *
 * The node environment, because jest-expo resolves packages with browser
 * conditions and `yaml` would load as its ESM browser build.
 *
 * @jest-environment node
 */
import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';

const WORKFLOW_DIR = path.join(__dirname, '..', '.github', 'workflows');

type Map = Record<string, unknown>;
const isMap = (value: unknown): value is Map =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Failsafe: every scalar stays the text it was written as (`true` too). */
function load(source: string): Map {
  const doc = YAML.parseDocument(source, {schema: 'failsafe', merge: true});
  if (doc.errors.length > 0) throw new Error(doc.errors[0].message);
  const root = doc.toJS({maxAliasCount: 100});
  if (!isMap(root)) throw new Error('a workflow is a mapping');
  return root;
}

function jobsOf(root: Map): Array<[string, Map]> {
  if (!isMap(root.jobs)) throw new Error('jobs is not a mapping');
  return Object.entries(root.jobs).map(([id, body]) => {
    if (!isMap(body)) throw new Error('job ' + id + ' is not a mapping');
    return [id, body];
  });
}

function stepsOf(job: Map): Map[] {
  if (job.steps === undefined) return [];
  if (!Array.isArray(job.steps)) throw new Error('steps is not a sequence');
  return job.steps.map(step => {
    if (!isMap(step)) throw new Error('a step is not a mapping');
    return step;
  });
}

const REPORTS = /\breport\b/i;
/** `continue-on-error: true` — anything else (an expression, false) can fail. */
const cannotFail = (owner: Map): boolean =>
  String(owner['continue-on-error'] ?? '').trim() === 'true';

/**
 * R9-5: every job or step that cannot fail, and whose name does not say it
 * only reports. A step without a name shows its command as its name, which
 * says nothing about blocking, so it counts as misnamed.
 */
export function nonBlockingMisnamed(source: string): string[] {
  const out: string[] = [];
  for (const [id, job] of jobsOf(load(source))) {
    const jobName = String(job.name ?? id);
    const holdsReportOnly = cannotFail(job) || stepsOf(job).some(cannotFail);
    if (holdsReportOnly && !REPORTS.test(jobName)) out.push('job ' + id);
    stepsOf(job).forEach((step, index) => {
      if (cannotFail(step) && !REPORTS.test(String(step.name ?? ''))) {
        out.push(id + ' step ' + (index + 1));
      }
    });
  }
  return out;
}

/** R9-6 (a): where the token could get more than read access. */
export function permissionProblems(source: string): string[] {
  const root = load(source);
  const out: string[] = [];
  const check = (where: string, value: unknown): void => {
    if (typeof value === 'string') {
      if (value.trim() !== 'read-all') out.push(where + ' is ' + value);
    } else if (isMap(value)) {
      for (const [scope, level] of Object.entries(value)) {
        if (String(level).trim() === 'write') {
          out.push(where + '.' + scope + ' is write');
        }
      }
    } else if (value !== undefined) {
      out.push(where + ' is not a mapping');
    }
  };
  if (root.permissions === undefined) {
    out.push('no top-level permissions');
  }
  check('permissions', root.permissions);
  for (const [id, job] of jobsOf(root)) {
    check('jobs.' + id + '.permissions', job.permissions);
  }
  return out;
}

/** R9-6 (b): actions not published by GitHub, and not pinned to a full sha. */
export function unpinnedThirdPartyActions(source: string): {
  unpinned: string[];
  checked: number;
} {
  const unpinned: string[] = [];
  let checked = 0;
  for (const [id, job] of jobsOf(load(source))) {
    const uses = [job.uses, ...stepsOf(job).map(step => step.uses)];
    for (const value of uses) {
      if (value === undefined) continue;
      const ref = String(value).trim();
      checked += 1;
      if (ref.startsWith('./') || ref.startsWith('docker://')) continue;
      if (/^(actions|github)\//.test(ref)) continue;
      if (!/@[0-9a-f]{40}$/.test(ref)) unpinned.push(id + ': ' + ref);
    }
  }
  return {unpinned, checked};
}

const workflows = (): Array<[string, string]> =>
  fs
    .readdirSync(WORKFLOW_DIR)
    .filter(name => /\.ya?ml$/.test(name))
    .sort()
    .map(name => [
      name,
      fs.readFileSync(path.join(WORKFLOW_DIR, name), 'utf8'),
    ]);

const wf = (jobs: string, top = 'permissions:\n  contents: read\n'): string =>
  'name: CI\non: [push]\n' + top + 'jobs:\n' + jobs;

describe('the checks themselves (probes, not the real workflow)', () => {
  it('R9-5: flags a non-blocking step and its job when neither says "report"', () => {
    const source = wf(
      '  security:\n    name: Security Audit\n    steps:\n' +
        '      - name: Run npm audit\n        run: npm audit\n        continue-on-error: true\n' +
        '      - run: npm outdated\n        continue-on-error: true\n',
    );
    expect(nonBlockingMisnamed(source)).toEqual([
      'job security',
      'security step 1',
      'security step 2',
    ]);
  });

  it('R9-5: accepts the same steps once the names say they only report', () => {
    const source = wf(
      '  deps:\n    name: Dependency Report\n    steps:\n' +
        '      - name: npm audit (report only)\n        run: npm audit\n        continue-on-error: true\n',
    );
    expect(nonBlockingMisnamed(source)).toEqual([]);
  });

  it('R9-5: a step that CAN fail needs no such name (the control)', () => {
    const source = wf(
      '  lint:\n    name: Lint\n    steps:\n' +
        '      - run: npm run lint\n' +
        '      - run: npm test\n        continue-on-error: ${{ matrix.experimental }}\n' +
        '      - run: npm audit\n        continue-on-error: false\n',
    );
    expect(nonBlockingMisnamed(source)).toEqual([]);
  });

  it('R9-5: a job-level continue-on-error counts as well', () => {
    const source = wf(
      '  audit:\n    name: Audit\n    continue-on-error: true\n    steps:\n      - run: npm audit\n',
    );
    expect(nonBlockingMisnamed(source)).toEqual(['job audit']);
  });

  it('R9-6: flags a missing top-level block, a write scope and write-all', () => {
    expect(permissionProblems(wf('  a:\n    steps: []\n', ''))).toEqual([
      'no top-level permissions',
    ]);
    expect(
      permissionProblems(
        wf(
          '  a:\n    permissions: write-all\n    steps: []\n',
          'permissions:\n  contents: write\n',
        ),
      ),
    ).toEqual([
      'permissions.contents is write',
      'jobs.a.permissions is write-all',
    ]);
    expect(permissionProblems(wf('  a:\n    steps: []\n'))).toEqual([]);
    expect(
      permissionProblems(
        wf('  a:\n    steps: []\n', 'permissions: read-all\n'),
      ),
    ).toEqual([]);
  });

  it('R9-6: flags a third-party action on a tag, and accepts GitHub actions and a sha', () => {
    const {unpinned, checked} = unpinnedThirdPartyActions(
      wf(
        '  a:\n    steps:\n      - uses: actions/checkout@v4\n' +
          '      - uses: codecov/codecov-action@v4\n' +
          '      - uses: codecov/codecov-action@b9fd7d16f6d7d1b5d2bec1a2887e65ceed900238 # v4.6.0\n' +
          '      - uses: ./.github/actions/local\n' +
          '  b:\n    uses: someone/workflows/.github/workflows/x.yml@main\n',
      ),
    );
    expect(unpinned).toEqual([
      'a: codecov/codecov-action@v4',
      'b: someone/workflows/.github/workflows/x.yml@main',
    ]);
    expect(checked).toBe(5);
  });
});

describe('the real workflows', () => {
  it('finds at least one workflow to check (the floor)', () => {
    expect(workflows().length).toBeGreaterThanOrEqual(1);
  });

  it('R9-5: nothing that cannot fail is named as if it could', () => {
    const misnamed = workflows().flatMap(([file, source]) =>
      nonBlockingMisnamed(source).map(entry => file + ' ' + entry),
    );
    expect(misnamed).toEqual([]);
  });

  it('R9-6: the token is read-only, declared in the file', () => {
    const problems = workflows().flatMap(([file, source]) =>
      permissionProblems(source).map(entry => file + ' ' + entry),
    );
    expect(problems).toEqual([]);
  });

  it('R9-6: every third-party action is pinned to a full commit sha', () => {
    let checked = 0;
    const unpinned: string[] = [];
    for (const [file, source] of workflows()) {
      const result = unpinnedThirdPartyActions(source);
      checked += result.checked;
      unpinned.push(...result.unpinned.map(entry => file + ' ' + entry));
    }
    expect(unpinned).toEqual([]);
    // The loop has to have reached the comparison.
    expect(checked).toBeGreaterThanOrEqual(1);
  });
});
