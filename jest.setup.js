/**
 * Jest setup — runs after the test framework is installed.
 *
 * Only mocks libraries that are actually installed. The previous version
 * mocked react-native-push-notification, react-native-vector-icons and
 * @react-navigation/native — none of which are dependencies anymore — which
 * made every test suite fail at setup time.
 */

import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Reanimated
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

// Silence the useNativeDriver warning emitted by the Animated module.
jest.spyOn(console, 'warn').mockImplementation(message => {
  if (typeof message === 'string' && message.includes('useNativeDriver')) {
    return;
  }

  console.warn(message);
});
