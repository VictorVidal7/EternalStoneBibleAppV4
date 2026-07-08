const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block corrupted directory created during build
config.resolver.blockList = [
  /node_modules\/\.expo-modules-core-[^/]*\/android\/build\/.*/,
];

config.resolver.assetExts.push('db', 'sqlite');
// expo-sqlite's web worker imports its wa-sqlite WASM binary directly;
// Metro doesn't treat .wasm as an asset by default (T20 web spike finding).
config.resolver.assetExts.push('wasm');
// Keep real class/function names in the production bundle. Crash reporting
// (src/lib/utils/logger.ts) forwards raw JS `Error` objects straight to
// Firebase Crashlytics via `recordError`, and this repo has no sourcemap
// upload/symbolication step for Crashlytics (unlike the @sentry/react-native
// setup it replaced in Sprint 40 — see the logger.ts migration note), so
// whatever names appear in `error.stack` are exactly what shows up in the
// Crashlytics dashboard. Mangled single-letter names would make crash
// triage far harder. Do not remove without first wiring up JS sourcemap
// symbolication for Crashlytics and verifying dashboard stack traces stay
// readable.
config.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    keep_classnames: true,
    keep_fnames: true,
  },
};
module.exports = config;
