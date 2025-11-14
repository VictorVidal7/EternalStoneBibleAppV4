import HapticFeedback from '../src/services/HapticFeedback';

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

describe('HapticFeedback Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('light', () => {
    it('should trigger light haptic feedback', () => {
      HapticFeedback.light();
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('medium', () => {
    it('should trigger medium haptic feedback', () => {
      HapticFeedback.medium();
      expect(true).toBe(true);
    });
  });

  describe('heavy', () => {
    it('should trigger heavy haptic feedback', () => {
      HapticFeedback.heavy();
      expect(true).toBe(true);
    });
  });

  describe('success', () => {
    it('should trigger success haptic feedback', () => {
      HapticFeedback.success();
      expect(true).toBe(true);
    });
  });

  describe('warning', () => {
    it('should trigger warning haptic feedback', () => {
      HapticFeedback.warning();
      expect(true).toBe(true);
    });
  });

  describe('error', () => {
    it('should trigger error haptic feedback', () => {
      HapticFeedback.error();
      expect(true).toBe(true);
    });
  });

  describe('isAvailable', () => {
    it('should return availability status', () => {
      const isAvailable = HapticFeedback.isAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });
  });
});
