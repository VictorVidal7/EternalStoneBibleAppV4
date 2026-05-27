/**
 * Expo config plugin — Android home-screen widget.
 *
 * Native widgets live in the `android/` source tree, which is
 * gitignored in this project (managed Expo workflow). This plugin
 * regenerates the widget files at `expo prebuild` time so the feature
 * survives a fresh native generation.
 *
 * What it does:
 *  1. Copies the widget's Kotlin source, layout, drawable and metadata
 *     into the prebuilt Android project.
 *  2. Adds the widget's <receiver> entry to AndroidManifest.xml.
 *  3. Appends the widget's two string resources to strings.xml.
 *
 * Para la gloria de Dios Todopoderoso.
 */

const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withStringsXml,
  withDangerousMod,
  AndroidConfig,
} = require('@expo/config-plugins');

const PACKAGE = 'com.eternalstonebible.app';
const WIDGET_FILES = {
  // Kotlin source — lives in java/<package-as-dirs>/
  java: 'VerseWidgetProvider.kt',
  // Resource files (layout/drawable/xml)
  layout: 'verse_widget.xml',
  drawable: 'verse_widget_bg.xml',
  xml: 'verse_widget_info.xml',
};

const ASSETS_ROOT = path.join(__dirname, 'widget-files');

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), {recursive: true});
  fs.copyFileSync(src, dest);
}

const withVerseWidget = config => {
  // 1. Drop the native files into the prebuilt project.
  config = withDangerousMod(config, [
    'android',
    async cfg => {
      const projectRoot = cfg.modRequest.platformProjectRoot;
      const mainDir = path.join(projectRoot, 'app', 'src', 'main');
      const javaDir = path.join(mainDir, 'java', ...PACKAGE.split('.'));
      copyFile(
        path.join(ASSETS_ROOT, WIDGET_FILES.java),
        path.join(javaDir, WIDGET_FILES.java),
      );
      copyFile(
        path.join(ASSETS_ROOT, WIDGET_FILES.layout),
        path.join(mainDir, 'res', 'layout', WIDGET_FILES.layout),
      );
      copyFile(
        path.join(ASSETS_ROOT, WIDGET_FILES.drawable),
        path.join(mainDir, 'res', 'drawable', WIDGET_FILES.drawable),
      );
      copyFile(
        path.join(ASSETS_ROOT, WIDGET_FILES.xml),
        path.join(mainDir, 'res', 'xml', WIDGET_FILES.xml),
      );
      return cfg;
    },
  ]);

  // 2. Register the <receiver> in AndroidManifest.
  config = withAndroidManifest(config, async cfg => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      cfg.modResults,
    );
    app.receiver = app.receiver || [];
    const already = app.receiver.find(
      r => r.$['android:name'] === '.VerseWidgetProvider',
    );
    if (!already) {
      app.receiver.push({
        $: {
          'android:name': '.VerseWidgetProvider',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/verse_widget_info',
            },
          },
        ],
      });
    }
    return cfg;
  });

  // 3. Append the widget's string resources.
  config = withStringsXml(config, async cfg => {
    const strings = cfg.modResults;
    const wanted = [
      {name: 'verse_widget_label', value: 'VERSO DEL DÍA'},
      {
        name: 'verse_widget_description',
        value:
          'Versículo bíblico curado, una rotación distinta cada día. Toca el widget para abrir la app.',
      },
    ];
    strings.resources.string = strings.resources.string || [];
    for (const w of wanted) {
      const exists = strings.resources.string.find(s => s.$.name === w.name);
      if (!exists) {
        strings.resources.string.push({$: {name: w.name}, _: w.value});
      }
    }
    return cfg;
  });

  return config;
};

module.exports = withVerseWidget;
