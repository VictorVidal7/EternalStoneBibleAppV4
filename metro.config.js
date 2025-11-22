const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block corrupted directory created during build
config.resolver.blockList = [
  /node_modules\/\.expo-modules-core-[^/]*\/android\/build\/.*/,
];

config.resolver.assetExts.push('db', 'sqlite');
config.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    keep_classnames: true,
    keep_fnames: true,
  },
};
module.exports = config;
