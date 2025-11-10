import { Platform, PermissionsAndroid } from 'react-native';
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
  constructor() {
    this.configure();
    this.createChannel();
  }

  configure = () => {
    PushNotification.configure({
      onRegister: function (token) {
        console.log("TOKEN:", token);
      },
      onNotification: function (notification) {
        console.log("NOTIFICATION:", notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });
  }

  createChannel = () => {
    PushNotification.createChannel(
      {
        channelId: "daily-reminder",
        channelName: "Daily Reminder",
        channelDescription: "A channel to categorise your notifications",
        playSound: false,
        soundName: "default",
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`createChannel returned '${created}'`)
    );
  }

  requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: "Permiso de Notificaciones",
            message: "La app necesita permiso para enviar notificaciones.",
            buttonNeutral: "Preguntar luego",
            buttonNegative: "Cancelar",
            buttonPositive: "OK"
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("Permiso de notificación concedido");
        } else {
          console.log("Permiso de notificación denegado");
        }
      } catch (err) {
        console.warn("Error al solicitar permisos:", err);
      }
    }
  }

  scheduleNotification = async (hour, minute) => {
    try {
      await this.requestPermissions();

      const date = new Date();
      date.setHours(hour);
      date.setMinutes(minute);

      if (Platform.OS === 'android' && Platform.Version >= 31) {
        // Para Android 12 y superiores
        PushNotification.localNotification({
          channelId: 'daily-reminder',
          title: "Recordatorio de lectura diaria",
          message: "Es hora de tu lectura bíblica diaria",
          date: date,
          allowWhileIdle: true,
          repeatType: 'day',
          repeatTime: 24 * 60 * 60 * 1000, // Repetir cada 24 horas
        });
      } else {
        // Para versiones anteriores de Android e iOS
        PushNotification.localNotificationSchedule({
          channelId: 'daily-reminder',
          title: "Recordatorio de lectura diaria",
          message: "Es hora de tu lectura bíblica diaria",
          date: date,
          allowWhileIdle: true,
          repeatType: 'day',
          repeatTime: 24 * 60 * 60 * 1000, // Repetir cada 24 horas
        });
      }

      await AsyncStorage.setItem('notificationTime', JSON.stringify({ hour, minute }));
      console.log(`Notification scheduled for ${hour}:${minute}`);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  cancelAllNotifications = async () => {
    try {
      PushNotification.cancelAllLocalNotifications();
      await AsyncStorage.removeItem('notificationTime');
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  getScheduledNotificationTime = async () => {
    try {
      const time = await AsyncStorage.getItem('notificationTime');
      return time ? JSON.parse(time) : null;
    } catch (error) {
      console.error('Error getting scheduled notification time:', error);
      return null;
    }
  }
}

export default new NotificationService();