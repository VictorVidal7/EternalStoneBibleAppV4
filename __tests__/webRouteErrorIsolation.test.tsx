/**
 * R9-14 — a crashing web route must not take the whole SPA with it.
 *
 * firebase.json serves `"source": "**"` → /index.html, so EVERY route under
 * app/ is reachable by direct URL on the deployed site, including the ones
 * the reduced web nav never links to. Several of them call hooks whose
 * provider app/_layout.web.tsx deliberately never mounts (useAuth,
 * useReadingProgress, useReadingPlanProgress, useCustomPlans, useTogether,
 * useDonationSheet) and those hooks THROW rather than degrade. With a single
 * ErrorBoundary at the root, one such throw replaced the entire app — nav
 * included — with the error screen, and the only affordance left was a
 * "Reintentar" that re-renders the same route and re-throws.
 *
 * These tests fix the ISOLATION, which is the amplifier — not the individual
 * routes, which still fail; they just fail locally now. Both levels of the
 * web tree are covered because the affected routes live at both: six under
 * app/features/** (screens of the root Stack) and app/(tabs)/plan/[id].tsx
 * (inside the tabs Slot).
 */
import React from 'react';
import {render, waitFor} from '@testing-library/react-native';

// Mutable mock state. `var` + the `mock` prefix are both required: jest
// hoists every jest.mock factory above the rest of the module.
// eslint-disable-next-line no-var
var mockPathname = '/plan/1';
// eslint-disable-next-line no-var
var mockSlotChild: {current: React.ComponentType} = {current: () => null};
// eslint-disable-next-line no-var
var mockCapturedStackProps: Record<string, unknown> | null = null;

jest.mock('expo-router', () => ({
  Slot: () => require('react').createElement(mockSlotChild.current),
  useRouter: () => ({push: jest.fn()}),
  usePathname: () => mockPathname,
  Stack: Object.assign(
    (props: Record<string, unknown>) => {
      mockCapturedStackProps = props;
      return null;
    },
    {Screen: () => null},
  ),
}));

jest.mock('../src/lib/database/data-loader', () => ({
  initializeBibleData: jest.fn(() => Promise.resolve()),
}));
jest.mock('../src/lib/database/data-loader.web', () => ({
  clearWebStorageForLockRecovery: jest.fn(() => Promise.resolve()),
}));
jest.mock('../src/lib/database/storageLockError', () => ({
  isStorageLockError: () => false,
}));
jest.mock('../src/lib/reader/fontAssets', () => ({
  loadFontFamily: jest.fn(() => Promise.resolve()),
}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({t: require('../src/i18n/translations').translations.es}),
  LanguageProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));
jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      background: '#ffffff',
      glassBorder: '#eeeeee',
      primary: '#0000ff',
      text: '#000000',
    },
    isDark: false,
  }),
}));
jest.mock('../src/context/ReaderPreferencesContext', () => ({
  useReaderPreferences: () => ({
    preferences: {fontFamily: 'sans'},
    hydrated: true,
  }),
  ReaderPreferencesProvider: ({children}: {children: React.ReactNode}) =>
    children,
}));

import TabLayoutWeb from '../app/(tabs)/_layout.web';
import {AppContent} from '../app/_layout.web';

const es = require('../src/i18n/translations').translations.es;

/**
 * Reproduces what `useReadingPlanProgress()` and friends actually do on web:
 * read a context whose Provider is not in the tree and throw from the render
 * body. A REAL throw is the point — the test has to prove the boundary
 * catches, not merely that it was rendered.
 */
function ProviderlessRoute(): React.ReactElement {
  throw new Error(
    'useReadingPlanProgress must be used within a ReadingPlanProgressProvider',
  );
}

function HealthyRoute(): React.ReactElement {
  const {Text} = require('react-native');
  return React.createElement(Text, null, 'healthy-route');
}

// React logs a console.error for every error a boundary catches; silence
// just that so a PASSING run stays readable.
let errorSpy: jest.SpyInstance;
beforeEach(() => {
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  mockPathname = '/plan/1';
  mockSlotChild.current = () => null;
  mockCapturedStackProps = null;
});
afterEach(() => {
  errorSpy.mockRestore();
});

describe('app/(tabs)/_layout.web.tsx — the nav shell survives a crashing route', () => {
  it('shows the fallback for the route while the top bar stays mounted', () => {
    mockSlotChild.current = ProviderlessRoute;

    const {getByText, getByLabelText} = render(<TabLayoutWeb />);

    // The route failed…
    expect(getByText(es.app.unexpectedErrorTitle)).toBeTruthy();
    // …but the way OUT of it is still on screen. That is the whole finding:
    // before the fix these two assertions could not both hold, because the
    // only boundary that could catch the throw was above the nav bar.
    expect(getByLabelText(es.tabs.bible)).toBeTruthy();
    expect(getByLabelText(es.tabs.settings)).toBeTruthy();
  });

  it('does not latch: navigating to a healthy route clears the fallback', () => {
    // A React error boundary keeps its error state until it unmounts, and
    // Slot reuses one element position for every route — so without
    // `key={pathname}` a single bad URL would poison every later navigation
    // in the session. This is the assertion that pins that key down.
    mockSlotChild.current = ProviderlessRoute;
    const {getByText, queryByText, rerender} = render(<TabLayoutWeb />);
    expect(getByText(es.app.unexpectedErrorTitle)).toBeTruthy();

    mockPathname = '/bible';
    mockSlotChild.current = HealthyRoute;
    rerender(<TabLayoutWeb />);

    expect(queryByText(es.app.unexpectedErrorTitle)).toBeNull();
    expect(getByText('healthy-route')).toBeTruthy();
  });
});

describe('app/_layout.web.tsx — each root Stack screen gets its own boundary', () => {
  it('passes a screenLayout that catches a route throw instead of letting it escape', async () => {
    render(<AppContent />);
    await waitFor(() => expect(mockCapturedStackProps).not.toBeNull());

    const screenLayout = mockCapturedStackProps?.screenLayout as
      ((args: {children: React.ReactNode}) => React.ReactElement) | undefined;
    expect(typeof screenLayout).toBe('function');

    // Render a throwing screen THROUGH the captured layout. If the Stack
    // shipped no screenLayout — or one that does not actually wrap in a
    // boundary — this render rethrows and the test fails loudly.
    const {getByText} = render(
      screenLayout!({children: <ProviderlessRoute />}),
    );
    expect(getByText(es.app.unexpectedErrorTitle)).toBeTruthy();
  });
});
