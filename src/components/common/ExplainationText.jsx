import React from 'react';
import { Text, StyleSheet } from 'react-native';

const ExplanationText = ({ text, style }) => {
  return <Text style={[styles.explanationText, style]}>{text}</Text>;
};

const styles = StyleSheet.create({
  explanationText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
});

export default ExplanationText;
