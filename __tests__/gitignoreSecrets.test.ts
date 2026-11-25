/**
 * R9-2 — the repo is PUBLIC, and the root `.gitignore` only covered
 * `.env*.local`. A plain `.env` — the most natural name for one, and one
 * `git add .` away from being published — was not ignored, nor were
 * `.env.production`, `scripts/.env` or `src/.env`. The two folders that hold
 * real secrets ignore their own (`functions/.gitignore`,
 * `vercel/gift-code-redeem/.gitignore`), but the blast radius of a miss is
 * total: the Firebase service account skips every Firestore rule, and the
 * RevenueCat secret key grants entitlements.
 *
 * Asked of git itself (`git check-ignore --no-index`), not of a reading of the
 * file, so whatever rule git applies is the rule measured.
 *
 * @jest-environment node
 */
import {execFileSync} from 'child_process';
import * as path from 'path';

const REPO_ROOT = path.join(__dirname, '..');

function isIgnored(file: string): boolean {
  try {
    execFileSync('git', ['check-ignore', '-q', '--no-index', file], {
      cwd: REPO_ROOT,
      stdio: 'ignore',
    });
    return true;
  } catch (error) {
    // Exit 1 means "not ignored"; anything else is git failing, not an answer.
    if ((error as {status?: number}).status === 1) return false;
    throw error;
  }
}

describe('R9-2: env files and signing secrets never reach the public repo', () => {
  it.each([
    '.env',
    '.env.production',
    '.env.local',
    'scripts/.env',
    'src/.env',
    'functions/.env',
    'vercel/gift-code-redeem/.env',
    'keystore.properties',
    'keystores/eternalbible-upload.jks',
    'scripts/firebase-admin-key.json',
  ])('ignores %s', file => {
    expect(isIgnored(file)).toBe(true);
  });

  it.each(['app.json', 'package.json', 'src/index.ts', 'environment.ts'])(
    'does not ignore %s (the control: the rule is not "ignore everything")',
    file => {
      expect(isIgnored(file)).toBe(false);
    },
  );
});
