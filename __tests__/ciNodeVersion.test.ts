/**
 * R9-82 — the Node version CI runs on is part of the contract, and nothing
 * checked it.
 *
 * `scripts/build-web-packs.js` requires `node:sqlite`, which does not exist
 * before Node 22. That was harmless while the script was only ever run by hand
 * on Victor's machine (Node 24) — but session 13 put a jest suite in front of
 * it (`__tests__/buildWebPacks.test.js`, R9-66), and `.github/workflows/ci.yml`
 * pinned `node-version: '20'`. So from that day the gate guarding the only
 * thing in this repo that produces PUBLISHED data never executed in CI at all:
 *
 *     FAIL __tests__/buildWebPacks.test.js
 *       ● Test suite failed to run
 *         No such built-in module: node:sqlite
 *
 * It was green locally on Node 24 and red in CI for four consecutive pushes to
 * `main`, and the only thing that said so was a GitHub notification email. That
 * is this program's own third blind spot wearing new clothes: the suite's
 * SILENCE meant "verified" locally and "I never loaded" in CI, and there was no
 * way to tell the two apart from inside the repo.
 *
 * Measured, not assumed — the whole suite, three times:
 *   Node 20.20.2 → 2 suites fail to LOAD, 4195 of 4250 tests run
 *   Node 22.23.2 → green
 *   Node 24.11.1 → green
 *
 * So this is the detector. It reads the workflow file CI really runs and the
 * `engines` field a developer really installs against, and refuses to let
 * either drift below what the repo needs. Deriving the floor from the code is
 * the point: the day nothing requires `node:sqlite` any more, the last case
 * here fails and says the floor can be lowered, rather than quietly outliving
 * its reason the way a stale allowlist does.
 */
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.join(__dirname, '..');

/**
 * The oldest major this repo's own tooling can run on. `node:sqlite` landed in
 * 22.5 behind `--experimental-sqlite` and is available without the flag on
 * current 22.x — verified by running the full suite under 22.23.2, and by
 * watching it fail to load under 20.20.2.
 */
const MINIMUM_NODE_MAJOR = 22;

function readWorkflow(): string {
  return fs.readFileSync(
    path.join(REPO_ROOT, '.github', 'workflows', 'ci.yml'),
    'utf8',
  );
}

describe('CI runs a Node new enough to load every test suite', () => {
  it('pins a node-version on every job (the floor: no matches passes vacuously)', () => {
    // Three jobs, three setup-node steps. Without this floor a renamed key or a
    // reformatted file would make the comparison below iterate over nothing and
    // report success — the exact vacuum R9-66 and R9-77 were both about.
    const pinned = [...readWorkflow().matchAll(/node-version:\s*'([^']+)'/g)];
    expect(pinned.length).toBeGreaterThanOrEqual(3);
  });

  it('never pins one below what the repo needs', () => {
    // The finding. `'20'` here is not a slower CI or a style choice: it is two
    // whole suites that never run, reported as one line in a job log nobody
    // reads twice.
    const tooOld = [...readWorkflow().matchAll(/node-version:\s*'([^']+)'/g)]
      .map(match => match[1])
      .filter(version => parseInt(version, 10) < MINIMUM_NODE_MAJOR);
    expect(tooOld).toEqual([]);
  });

  it('declares the same floor in package.json engines', () => {
    // Two places that must agree, which is this repo's third known blind spot.
    // A developer installing on Node 20 gets an npm warning naming the version,
    // instead of a green local run and a red CI they find out about by email.
    const pkg = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'),
    );
    expect(pkg.engines?.node).toBe(`>=${MINIMUM_NODE_MAJOR}`);
  });

  it('still has a reason to require it (guards against a stale floor)', () => {
    // The other direction, and the reason the constant above is allowed to be a
    // constant: it exists because something in this repo really does need
    // node:sqlite. The day that stops being true this fails and says so, rather
    // than holding CI to a version nothing needs any more.
    const script = fs.readFileSync(
      path.join(REPO_ROOT, 'scripts', 'build-web-packs.js'),
      'utf8',
    );
    expect(script).toContain("require('node:sqlite')");
  });
});
