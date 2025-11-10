const View = require('react-native').View;

module.exports = {
  State: {},
  PanGestureHandler: View,
  TapGestureHandler: View,
  ScrollView: View,
  Swipeable: View,
  DrawerLayout: View,
  FlatList: require('react-native').FlatList,
  gestureHandlerRootHOC: jest.fn(),
  Directions: {},
};