// src/context/ColorContext.js
import React, { createContext, useState, useContext } from "react";
import { BASE_COLORS } from "../constants/colors";

const ColorContext = createContext();

export const ColorProvider = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState(BASE_COLORS.lightBlue); // mặc định: green

  const COLORS = {
    ...BASE_COLORS,
    primary: primaryColor,
  };

  return (
    <ColorContext.Provider value={{ COLORS, setPrimaryColor }}>
      {children}
    </ColorContext.Provider>
  );
};

export const useColor = () => useContext(ColorContext);
