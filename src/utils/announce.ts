import { AccessibilityInfo, Platform } from 'react-native';

export function announce(message: string, { interrupt = false } = {}) {
  if (Platform.OS === 'ios') {
    AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: !interrupt });
  } else {
    AccessibilityInfo.announceForAccessibility(message);
  }
}
