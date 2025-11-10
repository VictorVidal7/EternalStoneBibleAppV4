import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import analytics from '@react-native-firebase/analytics';

// Inicializar Firebase Analytics
analytics().setAnalyticsCollectionEnabled(true);

AppRegistry.registerComponent(appName, () => App);