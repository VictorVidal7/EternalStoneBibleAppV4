import {Tabs} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {Platform} from 'react-native';
import {BlurView} from 'expo-blur';
import {useTheme} from '../../src/hooks/useTheme';
import {useLanguage} from '../../src/hooks/useLanguage';

export default function TabLayout() {
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();

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
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 88 : 68,
          marginHorizontal: 0,
          elevation: 0,
          shadowColor: isDark ? '#000' : colors.shadowColor,
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
          backgroundColor: colors.primary,
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
          tabBarIcon: ({color, size}) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
          headerTitle: t.headers.achievements,
        }}
      />

      <Tabs.Screen
        name="bookmarks"
        options={{
          title: t.tabs.bookmarks,
          tabBarIcon: ({color, size}) => (
            <Ionicons name="bookmark" size={size} color={color} />
          ),
          headerTitle: t.headers.bookmarks,
        }}
      />

      <Tabs.Screen
        name="notes"
        options={{
          title: t.tabs.notes,
          tabBarIcon: ({color, size}) => (
            <Ionicons name="create" size={size} color={color} />
          ),
          headerTitle: t.headers.notes,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          tabBarIcon: ({color, size}) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
          headerTitle: t.headers.settings,
        }}
      />
    </Tabs>
  );
}
