import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingScreen from "../features/setting/screens/SettingScreen";
import ProfileScreen from "../features/setting/screens/ProfileScreen";
import ChangeProfileScreen from "../features/setting/screens/ChangeProfileScreen";
import { useTranslation } from 'react-i18next'; // Import useTranslation hook
import ChangePassordScreen from "../features/setting/screens/ChangePasswordScreen";
import ChangeSystemAppearanceScreen from "../features/setting/screens/ChangeSystemAppearanceScreen";
const Stack = createNativeStackNavigator();

const SettingNavigator = () => {
      const { t } = useTranslation();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Setting"
        component={SettingScreen}
        options={{ title: t('setting.title') }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('setting.profile') }} 
      />
      <Stack.Screen
        name="ChangeProfile"
        component={ChangeProfileScreen}
        options={{ title: t('setting.changeProfile') }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePassordScreen}
        options={{ title: t('setting.changePassword') }}/>
      <Stack.Screen
        name="ChangeSystemAppearance"
        component={ChangeSystemAppearanceScreen}
        options={{ title: t('setting.changeSystemAppearance') }}/>

    </Stack.Navigator>
  );
};

export default SettingNavigator;
