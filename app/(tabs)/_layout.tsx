import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../src/hooks/useTheme';
import { useLanguage } from '../../src/hooks/useLanguage';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isDark
            ? 'rgba(20, 20, 20, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 12,
          height: Platform.OS === 'ios' ? 85 : 70,
          marginHorizontal: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerTitle: t.headers.home,
        }}
      />

      <Tabs.Screen
        name="bible"
        options={{
          title: t.tabs.bible,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
          headerTitle: t.headers.bible,
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: t.tabs.search,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
          headerTitle: t.headers.search,
        }}
      />

      <Tabs.Screen
        name="achievements"
        options={{
          title: t.tabs.achievements,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
          headerTitle: t.headers.achievements,
        }}
      />

      <Tabs.Screen
        name="bookmarks"
        options={{
          title: t.tabs.bookmarks,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark" size={size} color={color} />
          ),
          headerTitle: t.headers.bookmarks,
        }}
      />

      <Tabs.Screen
        name="notes"
        options={{
          title: t.tabs.notes,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create" size={size} color={color} />
          ),
          headerTitle: t.headers.notes,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
          headerTitle: t.headers.settings,
        }}
      />
    </Tabs>
  );
}
