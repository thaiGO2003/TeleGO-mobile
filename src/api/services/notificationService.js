// notificationsService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export const registerForPushNotificationsAsync = async () => {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Permission not granted!');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    console.log("Expo Push Token:", tokenData.data);
    return tokenData.data;
  } else {
    alert('Must use physical device for Push Notifications');
    return null;
  }
};
