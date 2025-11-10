import { Platform } from 'react-native';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false
};

const HapticFeedback = {
  light: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger("impactLight", options);
    } else {
      ReactNativeHapticFeedback.trigger("effectClick", options);
    }
  },
  medium: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger("impactMedium", options);
    } else {
      ReactNativeHapticFeedback.trigger("effectDoubleClick", options);
    }
  },
  heavy: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger("impactHeavy", options);
    } else {
      ReactNativeHapticFeedback.trigger("effectHeavyClick", options);
    }
  },
  success: () => {
    ReactNativeHapticFeedback.trigger("notificationSuccess", options);
  },
  warning: () => {
    ReactNativeHapticFeedback.trigger("notificationWarning", options);
  },
  error: () => {
    ReactNativeHapticFeedback.trigger("notificationError", options);
  }
};

export default HapticFeedback;