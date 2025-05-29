// components/PasswordInputForm.js
import React, { useState } from "react";
import { TextInput, Text, StyleSheet, View, TouchableOpacity, Image } from "react-native";
import { AntDesign } from '@expo/vector-icons';

const PasswordInputForm = ({ label, value, onChangeText, placeholder }) => {
  const [hidePass, setHidePass] = useState(true);

  const handleHidePass = () => {
    setHidePass(!hidePass);
  };

  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={hidePass} // Toggle the visibility of the password
        />
        <TouchableOpacity onPress={handleHidePass} style={styles.eyeIcon}>
          <AntDesign
            name={hidePass ? "eyeo" : "eye"}
            size={24}
            color="#ccc"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: 15,
    width: "100%",
  },
  label: {
    color: "#fff",
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  eyeIcon: {
    paddingRight: 10,
  },
});

export default PasswordInputForm;
