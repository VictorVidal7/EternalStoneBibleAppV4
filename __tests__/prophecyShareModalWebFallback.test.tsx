/**
 * Wiring test for `ProphecyShareModal` — one of the 7 standalone "share as
 * image" call sites that were hand-edited (not covered by the
 * `useShareImage` hook's own test) to call the new `shareOrDownloadImage`
 * web fallback. `shareOrDownloadImage.test.ts` covers the share-vs-download
 * decision itself; `useShareImageWebFallback.test.ts` covers the 11
 * hook-based modals. This pins that THIS site's hand-written branch is
 * wired correctly and preserves its deliberately asymmetric pre-existing
 * behavior: no success toast on the native "shared" path (the OS share
 * sheet is its own confirmation), but an explicit "downloaded" toast for
 * the new silent web-download path — and `onClose()` fires either way,
 * matching what the screen did before this change.
 */
import React from 'react';
import {render, act} from '@testing-library/react-native';
import {
  ProphecyShareModal,
  type ProphecyShareContent,
} from '../src/components/study/ProphecyShareModal';

type RootInstance = ReturnType<typeof render>['UNSAFE_root'];

/**
 * Presses the share button by invoking the `onPress` PROP directly, bypassing
 * `fireEvent.press`'s simulated touch-responder lifecycle. `getByLabelText`
 * resolves to the underlying HOST view (no `onPress` in its own props — RN
 * translates that into `onStartShouldSetResponder`/`onResponderRelease`
 * handlers instead), so `findAllByProps` walks the whole tree for the
 * composite `TouchableOpacity` that actually owns `onPress`.
 *
 * This button also swaps its children between an icon+label and an
 * `ActivityIndicator` when `sharing` flips true (mid-press, via
 * `setSharing(true)`) — combined with TouchableOpacity's own built-in
 * press-in/press-out opacity fade, simulating a REAL touch
 * (`fireEvent.press`) crashes react-test-renderer with "Unable to locate
 * attached view in the native tree" once the child swap and the fade
 * animation race. Calling the `onPress` prop directly skips that simulated
 * touch/animation lifecycle entirely and exercises the exact same
 * `handleShare` this test cares about.
 */
async function pressShare(root: RootInstance) {
  const candidates = root.findAllByProps({accessibilityLabel: 'Compartir'});
  const touchable = candidates.find(
    (el: (typeof candidates)[number]) => typeof el.props.onPress === 'function',
  );
  if (!touchable) throw new Error('Share TouchableOpacity not found');
  await act(async () => {
    touchable.props.onPress();
  });
}

const mockColors = {
  background: '#0f172a',
  surface: '#111827',
  border: '#374151',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  primary: '#38bdf8',
  onPrimary: '#ffffff',
};

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors}),
}));

jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({t: require('../src/i18n/translations').translations.es}),
}));

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('@context/ToastContext', () => ({
  useToast: () => ({success: mockToastSuccess, error: mockToastError}),
}));

jest.mock('@lib/haptics', () => ({
  haptics: {press: jest.fn(), tap: jest.fn()},
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(() => Promise.resolve('data:image/png;base64,xxx')),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const mockShareOrDownloadImage = jest.fn();
jest.mock('@/features/share/shareOrDownloadImage', () => ({
  shareOrDownloadImage: (...args: unknown[]) =>
    mockShareOrDownloadImage(...args),
}));

const content: ProphecyShareContent = {
  accent: '#38bdf8',
  groupTitle: 'Mesiánica',
  label: 'El Siervo sufriente',
  note: 'Isaías anticipa la pasión de Cristo.',
  prophecyLabel: 'Profecía',
  prophecyRef: 'Isaías 53:5',
  prophecyText: 'Mas él herido fue por nuestras rebeliones...',
  fulfilledLabel: 'Cumplida en',
  fulfillmentRef: '1 Pedro 2:24',
  fulfillmentText: 'quien llevó él mismo nuestros pecados...',
  quoted: true,
  quotedLabel: 'Citada en el NT',
  signature: 'Eternal Stone Bible',
};

describe('ProphecyShareModal — web fallback wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderModal(onClose = jest.fn()) {
    const utils = render(
      <ProphecyShareModal visible onClose={onClose} content={content} />,
    );
    return {...utils, onClose};
  }

  it('on "shared": shows no success toast, but still calls onClose (matches pre-existing native behavior)', async () => {
    mockShareOrDownloadImage.mockResolvedValue('shared');
    const {UNSAFE_root, onClose} = renderModal();

    await pressShare(UNSAFE_root);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('on "downloaded": shows the distinct "Imagen descargada" toast AND still calls onClose (the new web fallback path)', async () => {
    mockShareOrDownloadImage.mockResolvedValue('downloaded');
    const {UNSAFE_root, onClose} = renderModal();

    await pressShare(UNSAFE_root);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockToastSuccess).toHaveBeenCalledWith('Imagen descargada');
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('on "unavailable": shows the error toast and does NOT call onClose', async () => {
    mockShareOrDownloadImage.mockResolvedValue('unavailable');
    const {UNSAFE_root, onClose} = renderModal();

    await pressShare(UNSAFE_root);

    expect(mockToastError).toHaveBeenCalledWith(
      'No se pudo compartir la imagen',
    );
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
