import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColor } from '../../context/ColorContext';

const CommonWhiteContainer = ({ children }) => {
  const { COLORS } = useColor(); // 🎨 lấy màu trắng từ context

  return (
    <View style={[styles.container, { backgroundColor: COLORS.white }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 24,
  },
});

export default CommonWhiteContainer;
