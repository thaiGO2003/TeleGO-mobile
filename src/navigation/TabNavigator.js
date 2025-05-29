import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import ContactNavigator from './ContactNavigator';
import MessageNavigator from './MessageNavigator';
import SettingNavigator from './SettingNavigator';
import { COLORS } from '../constants/colors';
import { useTranslation } from 'react-i18next';

import { useColor } from '../context/ColorContext';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { COLORS } = useColor();
  const { t } = useTranslation(); // Use the translation hook

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: COLORS.white,
          bottom: 0,
          right: 0,
          left: 0,
          elevation: 0,
          height: 60,
        },
      }}>
      <Tab.Screen 
        name={t('tab.message')}
        component={MessageNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="chatbubble-outline" size={24} color={focused ? COLORS.primary : COLORS.black} />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? COLORS.primary : COLORS.black, fontSize: 12 }}>
              {t('tab.message')}
            </Text>
          ),
        }}
      />
      <Tab.Screen 
        name={t('tab.contact')}
        component={ContactNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="users" size={24} color={focused ? COLORS.primary : COLORS.black} />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? COLORS.primary : COLORS.black, fontSize: 12 }}>
              {t('tab.contact')}
            </Text>
          ),
        }}
      />
      <Tab.Screen 
        name={t('tab.setting')}
        component={SettingNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="more-horizontal" size={24} color={focused ? COLORS.primary : COLORS.black} />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? COLORS.primary : COLORS.black, fontSize: 12 }}>
              {t('tab.setting')}
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
