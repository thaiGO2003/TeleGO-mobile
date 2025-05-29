import React from "react";
import { View, StyleSheet } from "react-native";
import { useColor } from "../../context/ColorContext";

const CommonPrimaryContainer = ({ children, style, disableDefaultStyle }) => {
  const { COLORS } = useColor();
  const styles = createStyles(COLORS);

  const baseStyles = disableDefaultStyle ? [] : styles.container;

  const combinedStyles = [
    baseStyles,        // style mặc định (có thể bị ghi đè)
    style,             // style từ props
    { backgroundColor: COLORS.primary }, // luôn luôn áp dụng cuối cùng
  ];

  return <View style={combinedStyles}>{children}</View>;
};



const createStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.primary,
      justifyContent: "flex-start",
      alignItems: "center",
      padding: 24,
    },
  });

export default CommonPrimaryContainer;
