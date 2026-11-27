/**
 * R9-454 — the toast's ink on its status fill is legible in every real
 * palette.
 *
 * Text and icon were a fixed '#ffffff' on `colors.success/error/warning/info`,
 * which are LIGHT hues in dark mode and in «Alto contraste» (S122 probe: 103
 * of 132 under 4.5:1; high contrast success 1.74, info 1.56). The message is
 * 16 px: it needs 4.5:1.
 *
 * Lo REAL: the Toast component and the ThemeProvider, driven through its own
 * setters (mode, color theme, high contrast) over the AsyncStorage mock, so
 * every palette is the one the app composes. The colors are read from what
 * the Toast renders: the message's `color` and the fill of its container.
 */
import {StyleSheet} from 'react-native';
import {act, render} from '@testing-library/react-native';
import {Ionicons} from '@expo/vector-icons';
import {
  ThemeProvider,
  useTheme,
  themePrimaryColors,
} from '../src/hooks/useTheme';
import type {ColorTheme} from '../src/hooks/useTheme';
import Toast from '../src/components/Toast';
import {contrastRatio} from '../src/lib/a11y/contrast';

jest.mock('expo-blur', () => {
  const {View} = require('react-native');
  return {BlurView: View};
});

const VARIANTS = ['success', 'error', 'warning', 'info'] as const;

let theme: ReturnType<typeof useTheme> | null = null;
function Grab() {
  theme = useTheme();
  return null;
}

type Read = {ink: string; fill: string; icon: unknown};
type Measure = Read & {ratio: number};

function readToast(r: ReturnType<typeof render>, msg: string): Read {
  const txt = r.getByText(msg);
  const ink = StyleSheet.flatten(txt.props.style).color as string;
  let node = txt.parent;
  let fill: string | undefined;
  while (node && !fill) {
    const st = node.props?.style ? StyleSheet.flatten(node.props.style) : null;
    if (st?.backgroundColor) fill = st.backgroundColor as string;
    node = node.parent;
  }
  const icon = r.UNSAFE_getAllByType(Ionicons)[0]?.props.color;
  return {ink, fill: fill!, icon};
}

async function setPalette(
  mode: 'light' | 'dark',
  colorTheme: ColorTheme,
  highContrast: boolean,
) {
  // The setters persist to AsyncStorage; the next provider mounts read it.
  const r = render(
    <ThemeProvider>
      <Grab />
    </ThemeProvider>,
  );
  await act(async () => {});
  await act(async () => {
    await theme!.setThemeMode(mode);
    await theme!.setColorTheme(colorTheme);
    await theme!.setHighContrast(highContrast);
  });
  r.unmount();
}

/** Mount, let the three AsyncStorage reads land, measure. */
async function palette(
  mode: 'light' | 'dark',
  colorTheme: ColorTheme,
  highContrast: boolean,
) {
  await setPalette(mode, colorTheme, highContrast);
  const out: Record<string, Measure> = {};
  for (const v of VARIANTS) {
    const r = render(
      <ThemeProvider>
        <Grab />
        <Toast visible message={'MSG-' + v} variant={v} useBlur={false} />
      </ThemeProvider>,
    );
    await act(async () => {});
    // The provider really composed the palette asked for.
    expect({
      dark: theme!.isDark,
      hc: theme!.highContrast,
      ct: theme!.colorTheme,
    }).toEqual({
      dark: highContrast || mode === 'dark',
      hc: highContrast,
      ct: colorTheme,
    });
    const m = readToast(r, 'MSG-' + v);
    out[v] = {...m, ratio: contrastRatio(m.ink, m.fill)};
    r.unmount();
  }
  return out;
}

const THEMES = Object.keys(themePrimaryColors) as ColorTheme[];
const r2 = (n: number) => Math.round(n * 100) / 100;

function under(rows: Record<string, Record<string, Measure>>, min: number) {
  const bad: string[] = [];
  for (const [name, row] of Object.entries(rows)) {
    for (const v of VARIANTS) {
      if (row[v].ratio < min) bad.push(`${name}:${v}=${r2(row[v].ratio)}`);
    }
  }
  return bad;
}

describe('R9-454 — toast ink on its status fill', () => {
  it('dark mode, every color theme: message ≥ 4.5:1 on every variant, icon in the same ink', async () => {
    const rows: Record<string, Record<string, Measure>> = {};
    for (const ct of THEMES)
      rows[ct + '.dark'] = await palette('dark', ct, false);
    expect(Object.keys(rows)).toHaveLength(THEMES.length);
    expect(under(rows, 4.5)).toEqual([]);
    for (const row of Object.values(rows)) {
      for (const v of VARIANTS) expect(row[v].icon).toBe(row[v].ink);
    }
  });

  it('«Alto contraste»: message ≥ 4.5:1 on every variant', async () => {
    const rows = {hc: await palette('light', THEMES[0], true)};
    expect(under(rows, 4.5)).toEqual([]);
    for (const v of VARIANTS) expect(rows.hc[v].icon).toBe(rows.hc[v].ink);
  });

  it('light mode: ≥ 4.5:1 everywhere but ocean info, the one fill no theme ink reaches', async () => {
    const rows: Record<string, Record<string, Measure>> = {};
    for (const ct of THEMES) {
      rows[ct + '.light'] = await palette('light', ct, false);
    }
    // ocean.light info is sky-600 (#0284c7): 4.36 with the theme's text ink,
    // 4.10 with white. Neither token reaches 4.5; see the report (S190).
    expect(under(rows, 4.5)).toEqual(['ocean.light:info=4.36']);
  });

  it('control: the default variant keeps colors.text on colors.card', async () => {
    const r = render(
      <ThemeProvider>
        <Grab />
        <Toast visible message="CTL" variant="default" useBlur={false} />
      </ThemeProvider>,
    );
    await act(async () => {});
    const m = readToast(r, 'CTL');
    expect(m.ink).toBe(theme!.colors.text);
    expect(m.fill).toBe(theme!.colors.card);
  });
});
