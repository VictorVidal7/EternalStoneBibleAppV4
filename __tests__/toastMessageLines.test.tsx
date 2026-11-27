/**
 * R9-638 — the toast's default line cap no longer cuts the message at 2.
 *
 * Every toast goes through the provider, which passes `numberOfLines`
 * through as `undefined` unless the caller sets it: the default in
 * `Toast.tsx` governs them all. At 2 lines the R9-32 notice («Copia lista.
 * Solo queda guardada donde la hayas enviado (Drive, Descargas…)») lost its
 * destination at font scale 1.0, 1.3 and 2.0 (measured live in the 186 and
 * 186b), which is the whole point of the notice.
 *
 * Jest does not lay out text, so how many lines a message takes is NOT
 * measured here (pending, live). This locks what reaches the `Text`: the
 * default cap a caller gets with no third argument, and that an explicit cap
 * still wins.
 */
import {Text} from 'react-native';
import {render, act} from '@testing-library/react-native';
import {ToastProvider, useToast} from '../src/context/ToastContext';
import {translations} from '../src/i18n/translations';

jest.mock('expo-blur', () => {
  const {View} = require('react-native');
  return {BlurView: View};
});

let api: ReturnType<typeof useToast> | null = null;
function Grab() {
  api = useToast();
  return null;
}

function linesOf(r: ReturnType<typeof render>, message: string) {
  const node = r
    .UNSAFE_getAllByType(Text)
    .find(n => n.props.children === message);
  if (!node) throw new Error('toast message not drawn: ' + message);
  return node.props.numberOfLines as number | undefined;
}

beforeEach(() => {
  jest.useFakeTimers();
  api = null;
});
afterEach(() => {
  jest.useRealTimers();
});

describe('R9-638 — the toast line cap', () => {
  it.each(['es', 'en'] as const)(
    'the R9-32 notice, fired as DataSettings fires it (info, no third argument), gets the 6-line default (%s)',
    lang => {
      const msg = translations[lang].settings.exportReady;
      const r = render(
        <ToastProvider>
          <Grab />
        </ToastProvider>,
      );
      act(() => api!.info(msg));
      expect(linesOf(r, msg)).toBe(6);
    },
  );

  it('control: an explicit cap still wins, lower or higher than the default', () => {
    const r = render(
      <ToastProvider>
        <Grab />
      </ToastProvider>,
    );
    act(() => api!.info('cuatro', 6000, 4));
    expect(linesOf(r, 'cuatro')).toBe(4);
    act(() => api!.show({message: 'dos', variant: 'error', numberOfLines: 2}));
    expect(linesOf(r, 'dos')).toBe(2);
    act(() => api!.show({message: 'ocho', numberOfLines: 8}));
    expect(linesOf(r, 'ocho')).toBe(8);
  });
});
