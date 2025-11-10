import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import HomeScreen from '../screens/HomeScreen';
import BibleListScreen from '../screens/BibleListScreen';
import ChapterScreen from '../screens/ChapterScreen';
import VerseScreen from '../screens/VerseScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import SearchScreen from '../screens/SearchScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ReadingPlanScreen from '../screens/ReadingPlanScreen';

const Tab = createBottomTabNavigator();
const BibleStack = createStackNavigator();

const BibleStackNavigator = () => (
  <BibleStack.Navigator>
    <BibleStack.Screen name="BibleList" component={BibleListScreen} options={{ title: 'Libros' }} />
    <BibleStack.Screen name="Chapter" component={ChapterScreen} options={{ title: 'Capítulos' }} />
    <BibleStack.Screen name="Verse" component={VerseScreen} options={{ title: 'Versículos' }} />
  </BibleStack.Navigator>
);

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Bible') {
            iconName = 'book';
          } else if (route.name === 'Bookmarks') {
            iconName = 'bookmark';
          } else if (route.name === 'Search') {
            iconName = 'search';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Bible" component={BibleStackNavigator} options={{ title: 'Biblia' }} />
      <Tab.Screen name="Bookmarks" component={BookmarksScreen} options={{ title: 'Marcadores' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Búsqueda' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;