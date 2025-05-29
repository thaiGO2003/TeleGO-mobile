import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaView, StyleSheet } from "react-native"; // Thêm SafeAreaView và StyleSheet
import MessagesScreen from "../features/message/screens/MessagesScreen";
import { useTranslation } from "react-i18next";
import ChatScreen from "../features/message/screens/ChatScreen";
import ProfileScreen from "../features/message/screens/ProfileScreen";
import GroupInfo from "../features/message/screens/GroupInfoScreen";
import GroupChat from "../features/message/screens/GroupChatScreen";
import CreatePollScreen from "../features/message/screens/CreatePollScreen";
import InfoScreen from "../features/message/screens/InfoScreen";
const Stack = createNativeStackNavigator();

const MessageNavigator = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: styles.container, // Áp dụng style với paddingBottom
      }}
    >
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ title: t("tab.message") }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t("message.profile") }}
      />
      <Stack.Screen
        name="GroupChat"
        component={GroupChat}
        options={{
          title: t("message.groupChat") || "Nhóm chat",
        }}
      />
      <Stack.Screen
        name="GroupInfo"
        component={GroupInfo}
        options={{
          title: t("message.groupInfo") || "Thông tin nhóm",
        }}
      />
      <Stack.Screen
        name="CreatePoll"
        component={CreatePollScreen}
        options={{
          title: t("message.createPoll") || "Tạo khảo sát",
        }}
      />
      <Stack.Screen
        name="Info"
        component={InfoScreen}
        options={{
          title: t("message.info") || "Thông tin người dùng",
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 50, // Thêm lề dưới 30px
    backgroundColor: "#F5F5F5", // Giữ background giống GroupInfoScreen
  },
});

export default MessageNavigator;