import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useColor } from "../../context/ColorContext";

const PrimaryButton = ({ title, onPress, style, textStyle }) => {
  const { COLORS } = useColor();

  const dynamicStyles = {
    button: {
      backgroundColor: COLORS.primary,
      paddingVertical: 14,
      paddingHorizontal: 40,
      borderRadius: 10,
      marginVertical: 10,
      width: '100%',
    },
    buttonText: {
      textAlign: 'center',
      color: COLORS.white,
      fontSize: 16,
      fontWeight: 'bold',
      lineHeight: 22,
    },
  };

  return (
    <TouchableOpacity style={[dynamicStyles.button, style]} onPress={onPress}>
      <Text style={[dynamicStyles.buttonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default PrimaryButton;
