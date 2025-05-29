import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthEntryScreen from "../features/auth/screens/AuthEntryScreen";
import LoginScreen from "../features/auth/screens/LoginScreen";
import RegisterPersonalInfoScreen from "../features/auth/screens/RegisterPersonalInfoScreen";
import RegisterOTPScreen from "../features/auth/screens/RegisterOTPScreen";
import RegisterCredentialsScreen from "../features/auth/screens/RegisterCredentialsScreen";
import ForgotPasswordScreen from "../features/auth/screens/ForgotPasswordScreen";
import ForgotPasswordOTPScreen from "../features/auth/screens/ForgotPasswordOTPScreen";
import { useTranslation } from "react-i18next";

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {

  const { t } = useTranslation();

  return (
    <Stack.Navigator
      initialRouteName="AuthEntry"
      screenOptions={{ headerShown: true }}
    >
      <Stack.Screen
        name="AuthEntry"
        component={AuthEntryScreen}
        options={{ title: t("auth.AuthEntry") }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: t("auth.Login") }}
      />
      <Stack.Screen
        name="RegisterCredentials"
        component={RegisterCredentialsScreen}
        options={{ title: t("auth.RegisterCredentials") }}
      />
      <Stack.Screen
        name="RegisterPersonalInfo"
        component={RegisterPersonalInfoScreen}
        options={{ title: t("auth.RegisterPersonalInfo") }}
      />
      <Stack.Screen
        name="RegisterOTP"
        component={RegisterOTPScreen}
        options={{ title: t("auth.RegisterOTP") }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: t("auth.ForgotPassword") }}
      />
      <Stack.Screen
        name="ForgotPasswordOTP"
        component={ForgotPasswordOTPScreen}
        options={{ title: t("auth.ForgotPasswordOTP") }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
