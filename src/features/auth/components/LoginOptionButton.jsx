// components/LoginOptionButton.js
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import WhiteButton from "../../../components/common/WhiteButton";

const LoginOptionButton = ({ title, onPress, style }) => {
  return (
    <WhiteButton
      title={title}
      onPress={onPress}
      style={[styles.button, style]}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    fontSize: 16,
    width: "48%",
  },
});

export default LoginOptionButton;
