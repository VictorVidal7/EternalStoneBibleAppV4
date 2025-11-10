import analytics from '@react-native-firebase/analytics';

export const AnalyticsService = {
  logEvent: async (eventName, params = {}) => {
    try {
      await analytics().logEvent(eventName, params);
      console.log(`Logged event: ${eventName}`, params);
    } catch (error) {
      console.error('Error logging event:', error);
    }
  },

  setUserProperty: async (name, value) => {
    try {
      await analytics().setUserProperty(name, value);
      console.log(`Set user property: ${name} = ${value}`);
    } catch (error) {
      console.error('Error setting user property:', error);
    }
  },

  logScreenView: async (screenName) => {
    await AnalyticsService.logEvent('screen_view', { screen_name: screenName });
  },

  logReadingProgress: async (book, chapter, verse) => {
    await AnalyticsService.logEvent('reading_progress', { book, chapter, verse });
  },

  logPlanStarted: async (planId) => {
    await AnalyticsService.logEvent('plan_started', { plan_id: planId });
  },

  logSearch: async (query, searchType, resultsCount) => {
    await AnalyticsService.logEvent('search', { query, search_type: searchType, results_count: resultsCount });
  },

  logVerseRead: async (book, chapter, verse) => {
    await AnalyticsService.logEvent('verse_read', { book, chapter, verse });
  },

  logBookmarkAdded: async (book, chapter, verse) => {
    await AnalyticsService.logEvent('bookmark_added', { book, chapter, verse });
  },

  logNoteAdded: async (book, chapter, verse) => {
    await AnalyticsService.logEvent('note_added', { book, chapter, verse });
  },

  logShareVerse: async (book, chapter, verse) => {
    await AnalyticsService.logEvent('verse_shared', { book, chapter, verse });
  },

  logReadingPlanProgress: async (planId, dayCompleted) => {
    await AnalyticsService.logEvent('reading_plan_progress', { plan_id: planId, day_completed: dayCompleted });
  },

  logSettingsChanged: async (settingName, newValue) => {
    await AnalyticsService.logEvent('settings_changed', { setting_name: settingName, new_value: newValue });
  },

  logError: async (errorType, errorMessage) => {
    await AnalyticsService.logEvent('app_error', { error_type: errorType, error_message: errorMessage });
  },

  logPerformanceMetric: async (metricName, value) => {
    await AnalyticsService.logEvent('performance_metric', { metric_name: metricName, value });
  },
};

export default AnalyticsService;