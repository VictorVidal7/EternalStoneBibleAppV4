/**
 * bump-version.js — bump the app's version in lockstep across app.json and
 * package.json before cutting a release build.
 *
 * android/app/build.gradle is NOT touched here: it's gitignored and fully
 * regenerated from app.json by `expo prebuild` on every native build, so
 * app.json is the single source of truth for versionName/versionCode.
 *
 * Usage: node scripts/bump-version.js [patch|minor|major]  (default: patch)
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const APP_JSON_PATH = path.join(REPO_ROOT, 'app.json');
const PACKAGE_JSON_PATH = path.join(REPO_ROOT, 'package.json');

const VALID_BUMP_TYPES = ['patch', 'minor', 'major'];

function computeNextVersion(currentVersion, bumpType) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  if (bumpType === 'major') return `${major + 1}.0.0`;
  if (bumpType === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function bump(bumpType) {
  if (!VALID_BUMP_TYPES.includes(bumpType)) {
    throw new Error(
      `Unknown bump type "${bumpType}" — use one of: ${VALID_BUMP_TYPES.join(', ')}`,
    );
  }

  const appJsonText = fs.readFileSync(APP_JSON_PATH, 'utf8');
  const packageJsonText = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8');

  const versionMatch = appJsonText.match(/"version":\s*"(\d+\.\d+\.\d+)"/);
  const versionCodeMatch = appJsonText.match(/"versionCode":\s*(\d+)/);
  if (!versionMatch || !versionCodeMatch) {
    throw new Error(
      'Could not find "version" and "versionCode" in app.json — bump aborted.',
    );
  }

  const currentVersion = versionMatch[1];
  const currentVersionCode = Number(versionCodeMatch[1]);
  const nextVersion = computeNextVersion(currentVersion, bumpType);
  const nextVersionCode = currentVersionCode + 1;

  const nextAppJsonText = appJsonText
    .replace(`"version": "${currentVersion}"`, `"version": "${nextVersion}"`)
    .replace(
      `"versionCode": ${currentVersionCode}`,
      `"versionCode": ${nextVersionCode}`,
    );

  const packageVersionMatch = packageJsonText.match(
    /"version":\s*"(\d+\.\d+\.\d+)"/,
  );
  if (!packageVersionMatch) {
    throw new Error('Could not find "version" in package.json — bump aborted.');
  }
  const nextPackageJsonText = packageJsonText.replace(
    `"version": "${packageVersionMatch[1]}"`,
    `"version": "${nextVersion}"`,
  );

  fs.writeFileSync(APP_JSON_PATH, nextAppJsonText);
  fs.writeFileSync(PACKAGE_JSON_PATH, nextPackageJsonText);

  return {currentVersion, currentVersionCode, nextVersion, nextVersionCode};
}

if (require.main === module) {
  const bumpType = process.argv[2] || 'patch';
  try {
    const result = bump(bumpType);
    console.log(
      `Version bumped: ${result.currentVersion} (versionCode ${result.currentVersionCode}) -> ${result.nextVersion} (versionCode ${result.nextVersionCode})`,
    );
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = {bump, computeNextVersion};
