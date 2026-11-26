/**
 * R9-497 — «Reabrir» on an answered prayer used to clear the written
 * testimony on the first tap (`reopenRequest` drops `answeredNote` on
 * purpose), with no confirmation and no undo. The real journal screen and the
 * real store (AsyncStorage from jest.setup), mounted with `renderRouter`.
 */
import React from 'react';
import {Text} from 'react-native';
import {Stack, Tabs} from 'expo-router';
import {
  renderRouter,
  act,
  fireEvent,
  screen,
  waitFor,
} from 'expo-router/testing-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {translations} from '@/i18n/translations';

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
  };
});
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});
jest.mock('@lib/haptics', () => ({
  haptics: {
    tap: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    press: jest.fn(),
  },
}));
const mockColors = new Proxy({}, {get: () => '#123456'});
const mockTheme = {
  isDark: false,
  colors: mockColors,
  gradient: {headerColors: ['#000', '#111']},
  highContrast: false,
};
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockTheme}));
const mockLang = {
  language: 'es',
  t: require('@/i18n/translations').translations.es,
  setLanguage: jest.fn(),
};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
const mockToast = {
  success: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  show: jest.fn(),
};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
jest.mock('@components/insights/TestimonyImageModal', () => ({
  TestimonyImageModal: () => null,
}));

const Journal = require('../app/features/prayer/index').default;
const tp = translations.es.prayer;
const KEY = '@prayer_requests_v1';
const TESTIMONY = 'Salió bien de la operación, Dios fue fiel';

function routes() {
  return {
    _layout: () => (
      <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    ),
    '(tabs)/_layout': () => (
      <Tabs screenOptions={{headerShown: false}}>
        <Tabs.Screen name="index" />
      </Tabs>
    ),
    '(tabs)/index': () => <Text>home</Text>,
    'features/prayer/index': Journal,
  };
}
async function stored(id: string) {
  const list = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]');
  return list.find((r: {id: string}) => r.id === id);
}
async function press(label: string) {
  const els = await screen.findAllByLabelText(label);
  act(() => {
    fireEvent.press(els[els.length - 1]);
  });
}

const answered = {
  id: 'p1',
  title: 'Por mi madre',
  category: 'intercession',
  createdAt: 1000,
  answered: true,
  answeredAt: 2000,
  answeredNote: TESTIMONY,
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('asks before clearing a written testimony; Cancel keeps it', async () => {
  await AsyncStorage.setItem(KEY, JSON.stringify([answered]));
  renderRouter(routes(), {initialUrl: '/features/prayer'});
  await screen.findByText(TESTIMONY);

  await press(tp.reopen);
  await screen.findByText(tp.reopenConfirmTitle);
  await act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
  });
  expect((await stored('p1')).answeredNote).toBe(TESTIMONY);

  await press(tp.cancel);
  await act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
  });
  const p1 = await stored('p1');
  expect(p1.answered).toBe(true);
  expect(p1.answeredNote).toBe(TESTIMONY);
  expect(screen.getByText(TESTIMONY)).toBeTruthy();
});

it('confirming reopens it (and clears the testimony, as the store does)', async () => {
  await AsyncStorage.setItem(KEY, JSON.stringify([answered]));
  renderRouter(routes(), {initialUrl: '/features/prayer'});
  await screen.findByText(TESTIMONY);

  await press(tp.reopen);
  await screen.findByText(tp.reopenConfirmTitle);
  // The dialog's confirm button carries the same «Reabrir» label: the last one.
  await press(tp.reopen);
  await waitFor(async () => expect((await stored('p1')).answered).toBe(false));
  expect((await stored('p1')).answeredNote).toBeUndefined();
});

it('control: with no testimony written, «Reabrir» reopens at once', async () => {
  const {answeredNote: _omit, ...noNote} = answered;
  await AsyncStorage.setItem(KEY, JSON.stringify([noNote]));
  renderRouter(routes(), {initialUrl: '/features/prayer'});
  await screen.findByText('Por mi madre');

  await press(tp.reopen);
  await waitFor(async () => expect((await stored('p1')).answered).toBe(false));
  expect(screen.queryByText(tp.reopenConfirmTitle)).toBeNull();
});
