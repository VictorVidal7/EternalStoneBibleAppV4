/**
 * Expo config plugin — real Android release signing.
 *
 * `android/` is gitignored (managed Expo workflow) and gets fully wiped on
 * every `expo prebuild --clean`, which resets `android/app/build.gradle`'s
 * release signingConfig back to the throwaway debug keystore (publicly-known
 * password — cannot be uploaded to Play as a production build). This plugin
 * re-applies real release signing at every prebuild, sourced from a
 * `keystore.properties` file at the repo root (gitignored, never committed —
 * see keystore.properties itself for what's in it and why it must never be
 * lost).
 *
 * If keystore.properties doesn't exist (e.g. a fresh clone without the
 * secret file), this silently no-ops and leaves debug signing in place, so
 * local dev builds keep working without it.
 *
 * Para la gloria de Dios Todopoderoso.
 */

const fs = require('fs');
const path = require('path');
const {withAppBuildGradle} = require('@expo/config-plugins');

const REPO_ROOT = path.join(__dirname, '..');
const PROPERTIES_PATH = path.join(REPO_ROOT, 'keystore.properties');

function parseProperties(text) {
  const props = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    props[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return props;
}

const withReleaseSigning = config => {
  return withAppBuildGradle(config, cfg => {
    if (!fs.existsSync(PROPERTIES_PATH)) {
      console.warn(
        'with-release-signing: no keystore.properties at repo root — release builds stay debug-signed.',
      );
      return cfg;
    }

    const props = parseProperties(fs.readFileSync(PROPERTIES_PATH, 'utf8'));
    const required = [
      'RELEASE_STORE_FILE',
      'RELEASE_STORE_PASSWORD',
      'RELEASE_KEY_ALIAS',
      'RELEASE_KEY_PASSWORD',
    ];
    if (!required.every(key => props[key])) {
      console.warn(
        'with-release-signing: keystore.properties is missing required keys — release builds stay debug-signed.',
      );
      return cfg;
    }

    let contents = cfg.modResults.contents;

    // RELEASE_STORE_FILE is relative to the repo root (one level above
    // android/), not to android/app/ where Gradle would otherwise resolve a
    // bare file() call — go through rootProject.file() with an explicit ".."
    // so the path is correct regardless of where Gradle is invoked from.
    const releaseSigningBlock = `        release {
            storeFile rootProject.file('../${props.RELEASE_STORE_FILE}')
            storePassword '${props.RELEASE_STORE_PASSWORD}'
            keyAlias '${props.RELEASE_KEY_ALIAS}'
            keyPassword '${props.RELEASE_KEY_PASSWORD}'
        }
    }`;

    if (
      !contents.includes("rootProject.file('../" + props.RELEASE_STORE_FILE)
    ) {
      contents = contents.replace(
        /signingConfigs\s*\{([\s\S]*?)\n {4}\}/,
        (match, inner) => `signingConfigs {${inner}\n${releaseSigningBlock}`,
      );
    }

    contents = contents.replace(
      /release\s*\{\n(\s*)\/\/[^\n]*\n(\s*)\/\/[^\n]*\n(\s*)signingConfig signingConfigs\.debug/,
      (match, i1, i2, i3) =>
        `release {\n${i1}// Real upload keystore — see keystore.properties / plugins/with-release-signing.js\n${i3}signingConfig signingConfigs.release`,
    );

    cfg.modResults.contents = contents;
    return cfg;
  });
};

module.exports = withReleaseSigning;
