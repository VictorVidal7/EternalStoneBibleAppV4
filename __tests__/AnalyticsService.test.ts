import {AnalyticsService} from '../src/services/AnalyticsService';

describe('AnalyticsService', () => {
  describe('isAnalyticsAvailable', () => {
    it('should return boolean', () => {
      const isAvailable = AnalyticsService.isAnalyticsAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  describe('logScreenView', () => {
    it('should not throw when logging screen view', async () => {
      await expect(
        AnalyticsService.logScreenView('HomeScreen'),
      ).resolves.not.toThrow();
    });
  });

  describe('logReadingProgress', () => {
    it('should not throw when logging reading progress', async () => {
      await expect(
        AnalyticsService.logReadingProgress('Genesis', 1, 1),
      ).resolves.not.toThrow();
    });
  });

  describe('logSearch', () => {
    it('should not throw when logging search', async () => {
      await expect(
        AnalyticsService.logSearch('love', 'all', 10),
      ).resolves.not.toThrow();
    });
  });

  describe('logError', () => {
    it('should not throw when logging error', async () => {
      await expect(
        AnalyticsService.logError('TestError', 'Test error message'),
      ).resolves.not.toThrow();
    });
  });

  describe('setUserProperty', () => {
    it('should not throw when setting user property', async () => {
      await expect(
        AnalyticsService.setUserProperty('theme', 'dark'),
      ).resolves.not.toThrow();
    });
  });
});
