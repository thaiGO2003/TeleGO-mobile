// src/navigation/ContactNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ContactScreen from "../features/contact/screens/ContactScreen";
import ChatScreen from "../features/message/screens/ChatScreen";
import ProfileScreen from "../features/message/screens/ProfileScreen";
const Stack = createNativeStackNavigator();
import { useTranslation } from "react-i18next";

const ContactNavigator = () => {
  const { t } = useTranslation();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Contacts"
        options={{
          title: t("contact.contact") || "Danh bạ",
        }}
        component={ContactScreen}
      />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t("contact.profile") }}
      />
    </Stack.Navigator>
  );
};

export default ContactNavigator;
