import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock for @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock for react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    PanGestureHandler: View,
    TapGestureHandler: View,
    ScrollView: View,
    State: {},
    gestureHandlerRootHOC: jest.fn(),
  };
});

// Mock for react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock for react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

// Mock for @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useIsFocused: () => true,
}));

// Mock for react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MockedMaterialIcons');

// Mock for react-native-push-notification
jest.mock('react-native-push-notification', () => ({
  configure: jest.fn(),
  createChannel: jest.fn(),
  onRegister: jest.fn(),
  onNotification: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  requestPermissions: jest.fn(),
  abandonPermissions: jest.fn(),
  checkPermissions: jest.fn(),
  getInitialNotification: jest.fn(),
  getChannels: jest.fn(),
  localNotification: jest.fn(),
  localNotificationSchedule: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
  removeAllDeliveredNotifications: jest.fn(),
  getDeliveredNotifications: jest.fn(),
  removeDeliveredNotifications: jest.fn(),
  setApplicationIconBadgeNumber: jest.fn(),
  getApplicationIconBadgeNumber: jest.fn(),
  cancelLocalNotifications: jest.fn(),
  getScheduledLocalNotifications: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationResponseReceivedListener: jest.fn(),
}));

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Ignore useNativeDriver warning
jest.spyOn(console, 'warn').mockImplementation((message) => {
  if (message.includes('useNativeDriver')) {
    return null;
  }
  console.warn(message);
});

// Set up global mock for Date
const mockDate = new Date('2024-01-01T00:00:00Z');
global.Date = class extends Date {
  constructor() {
    return mockDate;
  }
};

// Mock for react-native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.SettingsManager = {
    settings: {
      AppleLocale: 'en_US',
      AppleLanguages: ['en'],
    },
  };
  return RN;
});

// Set up fetch mock
global.fetch = jest.fn(() => Promise.resolve({
  json: () => Promise.resolve({}),
}));

// Suppress console errors when running tests
console.error = jest.fn();