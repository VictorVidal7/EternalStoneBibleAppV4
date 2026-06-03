import * as Haptics from 'expo-haptics';
import {haptics} from '../src/lib/haptics';

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {Light: 'light', Medium: 'medium', Heavy: 'heavy'},
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
}));

const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;

describe('haptics — unified tactile feedback', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps impact intents to the right ImpactFeedbackStyle', () => {
    haptics.tap();
    haptics.press();
    haptics.heavy();
    expect(mockHaptics.impactAsync).toHaveBeenNthCalledWith(1, 'light');
    expect(mockHaptics.impactAsync).toHaveBeenNthCalledWith(2, 'medium');
    expect(mockHaptics.impactAsync).toHaveBeenNthCalledWith(3, 'heavy');
  });

  it('fires a selection tick', () => {
    haptics.selection();
    expect(mockHaptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it('maps notification intents to the right NotificationFeedbackType', () => {
    haptics.success();
    haptics.warning();
    haptics.error();
    expect(mockHaptics.notificationAsync).toHaveBeenNthCalledWith(1, 'success');
    expect(mockHaptics.notificationAsync).toHaveBeenNthCalledWith(2, 'warning');
    expect(mockHaptics.notificationAsync).toHaveBeenNthCalledWith(3, 'error');
  });

  it('swallows a rejected haptic (best-effort on unsupported devices)', async () => {
    mockHaptics.impactAsync.mockImplementationOnce(() =>
      Promise.reject(new Error('no vibrator')),
    );
    expect(() => haptics.tap()).not.toThrow();
    // Let the swallowed rejection settle without an unhandled-rejection error.
    await Promise.resolve();
  });

  it('swallows a synchronous throw', () => {
    mockHaptics.selectionAsync.mockImplementationOnce(() => {
      throw new Error('module unavailable');
    });
    expect(() => haptics.selection()).not.toThrow();
  });
});
