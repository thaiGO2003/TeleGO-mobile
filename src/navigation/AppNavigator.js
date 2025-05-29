// src/navigation/AppNavigation.js
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigation from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { AuthContext } from '../context/AuthContext';

const AppNavigation = () => {
  const { user } = useContext(AuthContext);

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigation />}
    </NavigationContainer>
  );
};

export default AppNavigation;