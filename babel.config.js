module.exports = function (api) {
  api.cache(true);

  const plugins = [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src',
          '@app': './app',
          '@components': './src/components',
          '@screens': './src/screens',
          '@lib': './src/lib',
          '@hooks': './src/hooks',
          '@context': './src/context',
          '@types': './src/types',
        },
      },
    ],
  ];

  // Remove console.log in production
  if (process.env.NODE_ENV === 'production') {
    plugins.push(['transform-remove-console', {exclude: ['error', 'warn']}]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
