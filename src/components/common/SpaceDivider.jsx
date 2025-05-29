import React from 'react';
import { View, StyleSheet } from 'react-native';

const SpaceDivider = () => {
  return <View style={styles.divider} />;
};

const styles = StyleSheet.create({
  divider: {
    minHeight: 2,
    backgroundColor: "#ccc",
    marginVertical: 5,
  },
});

export default SpaceDivider;
