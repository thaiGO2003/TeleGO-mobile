import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColor } from "../../../context/ColorContext";
import { getUserQRById } from "../../../api/services/userService";
const ProfileInfo = ({ label, value }) => {
  const { COLORS } = useColor();
  return (
    <View style={[styles.container, { borderColor: "#E8ECF4" }]}>
      <Text style={[styles.label , { color: COLORS.gray }]}>{label}</Text>
      <Text style={[styles.value , { color: COLORS.black }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    height: 70,
    flexDirection: "row",
    borderWidth: 0.5,
    paddingHorizontal: "10%",
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 20,
  },
  value: {
    flex: 2,
    fontSize: 18,
    lineHeight: 20,
  },
});

export default ProfileInfo;
