import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useColor } from "../../../context/ColorContext";

const BirthdayBanner = ({ friend, userId, onSendBirthdayMessage }) => {
  const { COLORS } = useColor();

  return (
    <View style={[styles.bannerContainer, { backgroundColor: COLORS.white }]}>
      <Text style={styles.bannerText}>
        Hôm nay là sinh nhật của <Text style={styles.boldText}>{friend.fullName}</Text> 🎉
      </Text>
      <TouchableOpacity
        style={[styles.congratulateButton, { backgroundColor: COLORS.primary }]}
        onPress={() => onSendBirthdayMessage(friend._id, friend.fullName, userId)}
      >
        <Text style={styles.buttonText}>Chúc mừng</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bannerText: {
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  boldText: {
    fontWeight: "bold",
  },
  congratulateButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default BirthdayBanner;