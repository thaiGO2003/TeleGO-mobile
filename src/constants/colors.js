// src/constants/colors.js
export const BASE_COLORS = {
  red: "#FF0000",           // Đỏ
  lightRed: "#FFA3A3",      // Đỏ nhạt

  orange: "#FF7F00",        // Cam
  lightOrange: "#FFD1A3",   // Cam nhạt

  yellow: "#FFFF00",        // Vàng
  lightYellow: "#FFFFCC",   // Vàng nhạt

  green: "#4CAF50",         // Lục
  lightGreen: "#A8E6A3",    // Lục nhạt

  blue: "#0000FF",          // Lam
  lightBlue: "#A3C9FF",     // Lam nhạt

  indigo: "#4B0082",        // Chàm
  lightIndigo: "#C3B1E1",   // Chàm nhạt

  violet: "#8B00FF",        // Tím
  lightViolet: "#D6A3FF",   // Tím nhạt

  white: "#FFFFFF",
  black: "#000000",

  white2: "#bab2b2",
  transparent: "transparent",
};

export const COLOR_OPTIONS = Object.entries(BASE_COLORS).map(([name, value]) => ({
  name,
  value,
}));