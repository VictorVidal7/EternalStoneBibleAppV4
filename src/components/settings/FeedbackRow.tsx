/**
 * Zero-backend bug/feedback entry point, sitting in the About card on the
 * Settings screen. Deliberately a plain `mailto:` link, NOT a
 * Firestore-backed inbox — this app has a standing rule to minimize
 * Firestore sync/writes wherever an alternative exists, and a bug report is
 * exactly the kind of low-volume, no-realtime-need write that doesn't
 * justify a new backend.
 *
 * Prefills a small diagnostic footer (app version, platform) so reports
 * arrive with basic repro context. `expo-device` is NOT a dependency of
 * this app, so the device model/brand line is intentionally omitted rather
 * than adding a new dependency for it — add it later if that package is
 * ever pulled in for another reason.
 */

import {Linking, Platform, StyleSheet, TouchableOpacity} from 'react-native';
import {AppText as Text} from '@components/ui/AppText';
import {Ionicons} from '@expo/vector-icons';
import Constants from 'expo-constants';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';

// Single named constant for the destination address — the app's public
// contact alias (Play Console store-listing contact), not Victor's raw
// personal address.
export const FEEDBACK_EMAIL = 'victorvdu+eternalstone@gmail.com';

export default function FeedbackRow() {
  const {colors} = useTheme();
  const {t} = useLanguage();

  function handlePress() {
    haptics.tap();
    // Unlike settings.tsx's display fallback ('3.0.4'), this string goes
    // into a diagnostics payload whose whole point is telling us which
    // build the reporter is on — a plausible-looking fake version would be
    // worse than an honest "unknown" here.
    const version = Constants.expoConfig?.version ?? 'unknown';
    const body = [
      '',
      '',
      '---',
      `${t.settings.feedback.bodyVersionLabel} ${version}`,
      `${t.settings.feedback.bodyPlatformLabel} ${Platform.OS} ${Platform.Version}`,
    ].join('\n');
    const url =
      `mailto:${FEEDBACK_EMAIL}` +
      `?subject=${encodeURIComponent(t.settings.feedback.emailSubject)}` +
      `&body=${encodeURIComponent(body)}`;
    void Linking.openURL(url);
  }

  return (
    <TouchableOpacity
      style={[
        styles.linkButton,
        {backgroundColor: colors.primary + '40', borderColor: colors.primary},
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={t.settings.feedback.rowLabel}>
      <Ionicons name="mail-outline" size={20} color={colors.primary} />
      <Text style={[styles.linkText, {color: colors.primary}]}>
        {t.settings.feedback.rowLabel}
      </Text>
    </TouchableOpacity>
  );
}

// Mirrors settings.tsx's `themedStyles.linkButton` / `linkText` exactly —
// this is the established tappable-row look already used in this same
// About card (the __DEV__ Crashlytics test row), reused rather than
// reinvented.
const styles = StyleSheet.create({
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});
