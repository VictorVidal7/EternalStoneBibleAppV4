import {Tabs} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';

export default function TabLayout() {
  const {colors, isDark, gradient} = useTheme();
  const {t} = useLanguage();
  const insets = useSafeAreaInsets();

  // Fallback color in case gradient is not ready
  const headerBgColor = gradient?.headerColors?.[0] ?? colors.primary;

  // Base tab bar height (content) — the system navigation inset is added on
  // top so the gesture pill never overlaps the labels.
  const tabBarBaseHeight = Platform.OS === 'ios' ? 88 : 68;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isDark
            ? 'rgba(26, 29, 46, 0.95)' // Nuevo color oscuro consistente
            : 'rgba(255, 255, 255, 0.98)', // Más sólido en claro
          borderTopWidth: 1,
          borderTopColor: isDark
            ? 'rgba(71, 85, 105, 0.15)' // Borde sutil oscuro
            : 'rgba(226, 232, 240, 0.60)', // Borde sutil claro
          borderTopLeftRadius: 28, // Bordes más suaves
          borderTopRightRadius: 28,
          // Add the bottom safe-area inset so the system gesture pill sits
          // below the labels instead of slashing through them.
          paddingBottom: (Platform.OS === 'ios' ? 24 : 12) + insets.bottom,
          paddingTop: 10,
          height: tabBarBaseHeight + insets.bottom,
          marginHorizontal: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: -2},
          shadowOpacity: isDark ? 0.4 : 0.08,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: -0.2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: headerBgColor,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          letterSpacing: -0.5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerTitle: t.headers.home,
        }}
      />

      <Tabs.Screen
        name="bible"
        options={{
          title: t.tabs.bible,
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Ionicons name="book" size={size} color={color} />
          ),
          headerTitle: t.headers.bible,
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: t.tabs.search,
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Ionicons name="search" size={size} color={color} />
          ),
          headerTitle: t.headers.search,
        }}
      />

      <Tabs.Screen
        name="achievements"
        options={{
          title: t.tabs.achievements,
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
          headerTitle: t.headers.achievements,
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
          title: t.tabs.favorites,
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
          headerTitle: t.headers.favorites,
        }}
      />

      <Tabs.Screen
        name="notes"
        options={{
          href: null,
          title: t.tabs.notes,
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Ionicons name="create" size={size} color={color} />
          ),
          headerTitle: t.headers.notes,
        }}
      />

      <Tabs.Screen
        name="highlights"
        options={{
          href: null,
          title: t.highlights.title,
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Ionicons name="color-palette" size={size} color={color} />
          ),
          headerTitle: t.highlights.title,
        }}
      />

      <Tabs.Screen
        name="bookmarks"
        options={{
          href: null,
          title: t.bookmarks.title,
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Ionicons name="bookmark" size={size} color={color} />
          ),
          headerTitle: t.bookmarks.title,
        }}
      />

      <Tabs.Screen
        name="chapter/[book]"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="verse/[book]/[chapter]"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="plan/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="conflicts"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
          headerTitle: t.headers.settings,
        }}
      />
    </Tabs>
  );
}
