// src/context/AppContext.js
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    const stored = await AsyncStorage.getItem("userData");
    if (stored) setUserData(JSON.parse(stored));
    setLoading(false);
  };

  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <AppContext.Provider value={{ userData, setUserData, reloadUserData: loadUserData }}>
      {!loading && children}
    </AppContext.Provider>
  );
};
