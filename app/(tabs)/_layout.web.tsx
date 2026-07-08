import {Slot, useRouter, usePathname} from 'expo-router';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';

/**
 * Web nav shell (T21) — replaces native's bottom Tabs bar with a lightweight
 * top bar (Biblia + Ajustes only, per Victor's confirmed "reduced web nav"
 * choice). Slot renders whichever web route matched with no extra chrome —
 * each screen owns its own header/back button.
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
        <Slot />
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
