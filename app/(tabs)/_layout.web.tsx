import {Slot, useRouter, usePathname} from 'expo-router';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {ErrorBoundary} from '@components/ErrorBoundary';

/**
 * Web nav shell (T21) — replaces native's bottom Tabs bar with a lightweight
 * top bar (Biblia + Ajustes only, per Victor's confirmed "reduced web nav"
 * choice). Slot renders whichever web route matched with no extra chrome —
 * each screen owns its own header/back button.
 *
 * R9-14: the Slot — and ONLY the Slot — is wrapped in its own ErrorBoundary.
 * firebase.json serves a catch-all SPA rewrite, so every route under
 * app/(tabs)/ is reachable by direct URL even though this bar only offers two
 * destinations, and several of them call hooks whose provider the web tree
 * deliberately never mounts (app/(tabs)/plan/[id].tsx: useReadingPlanProgress
 * / useTogether / useCustomPlans). Those hooks throw, and with only the root
 * boundary in app/_layout.web.tsx the throw took the whole SPA down —
 * including this bar, which is the user's only way out. Keeping the bar
 * OUTSIDE the boundary turns "the web app is dead" into "this one page failed,
 * click Biblia".
 *
 * `key={pathname}` is load-bearing: a React error boundary latches its error
 * state, and Slot reuses the same element position for every route, so
 * without a per-route key the fallback would persist after navigating away
 * and a single bad URL would still poison the session.
 */
export default function TabLayoutWeb() {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const onSettings = pathname?.startsWith('/settings');

  return (
    <View style={[styles.root, {backgroundColor: colors.background}]}>
      <View style={[styles.topBar, {borderBottomColor: colors.glassBorder}]}>
        <TouchableOpacity
          onPress={() => router.push('/bible' as never)}
          accessibilityRole="button"
          accessibilityLabel={t.tabs.bible}
          style={styles.brand}>
          <Ionicons name="book" size={20} color={colors.primary} />
          <Text style={[styles.brandText, {color: colors.text}]}>
            Eternal Stone Bible
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/settings' as never)}
          accessibilityRole="button"
          accessibilityLabel={t.tabs.settings}
          style={[
            styles.settingsButton,
            onSettings && {backgroundColor: colors.primary + '20'},
          ]}>
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <ErrorBoundary key={pathname}>
          <Slot />
        </ErrorBoundary>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  brand: {flexDirection: 'row', alignItems: 'center', gap: 8},
  brandText: {fontSize: 15, fontWeight: '700'},
  settingsButton: {padding: 8, borderRadius: 8},
  content: {flex: 1},
});
