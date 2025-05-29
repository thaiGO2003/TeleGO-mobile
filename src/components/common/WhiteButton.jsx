import React from 'react';
import { StyleSheet } from 'react-native';
import PrimaryButton from './PrimaryButton';
import { useColor } from "../../context/ColorContext";

const WhiteButton = ({ title, onPress, style, textStyle }) => {
  const { COLORS } = useColor(); // Lấy màu từ context

  const styles = StyleSheet.create({
    whiteButton: {
      backgroundColor: COLORS.white,
      borderWidth: 1,
      borderColor: COLORS.primary,
    },
    whiteButtonText: {
      color: COLORS.primary,
    },
  });

  return (
    <PrimaryButton
      title={title}
      onPress={onPress}
      style={[styles.whiteButton, style]}
      textStyle={[styles.whiteButtonText, textStyle]}
    />
  );
};

export default WhiteButton;
