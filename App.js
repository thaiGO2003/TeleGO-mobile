// App.js
import React, { useEffect, useState, useRef } from "react";
import AppNavigation from "./src/navigation/AppNavigator";
import i18n from "./src/i18n/i18n";
import { AuthProvider } from "./src/context/AuthContext";
import { ColorProvider } from "./src/context/ColorContext";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { SocketProvider } from "./src/context/SocketContext";
import { ModalProvider } from "./src/context/ModalContext"; // 👈 tạo file này nhé
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(); // Tắt toàn bộ warning và error
import { use } from "i18next";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { registerForPushNotificationsAsync } from "./src/api/services/notificationService";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // ✅ Hiển thị thông báo dạng popup
    shouldPlaySound: true, // 🔊 Phát âm thanh nếu có
    shouldSetBadge: false,
  }),
});
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("expo-notifications") &&
    args[0].includes("Android Push notifications")
  ) {
    return; // Bỏ qua cảnh báo liên quan đến expo-notifications
  }
  originalWarn(...args);
};
export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
      console.log("📱 Expo Push Token:", token);
      // 👉 Gửi token này về backend để lưu nếu cần
    });

    // Lắng nghe khi có thông báo đến
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📥 Nhận thông báo:", notification);
      });

    // Lắng nghe khi user bấm vào thông báo
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 User click vào thông báo:", response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
  return (
    <ActionSheetProvider>
      <ColorProvider>
        <AuthProvider>
          <SocketProvider>
            <ModalProvider>
              <AppNavigation />
            </ModalProvider>
          </SocketProvider>
        </AuthProvider>
      </ColorProvider>
    </ActionSheetProvider>
  );
}
