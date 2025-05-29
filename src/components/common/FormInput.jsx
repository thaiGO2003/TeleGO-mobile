import React from "react";
import { TextInput, Text, StyleSheet, View } from "react-native";

const FormInput = ({ label, value, onChangeText, placeholder, secureTextEntry, labelStyle }) => (
  <View style={styles.formGroup}>
    <Text style={[styles.label, labelStyle]}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
    />
  </View>
);

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: 15,
    width: "100%",
  },
  label: {
    color: "#fff",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    lineHeight: 20,
  },
});

export default FormInput;