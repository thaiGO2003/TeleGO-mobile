import React from "react";
import { View, Image, StyleSheet } from "react-native";

const AvatarImage = ({ source }) => {
  return (
    <View style={styles.container}>
      <Image source={source} style={styles.avatar} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#fff", // Bạn có thể thay đổi màu sắc border nếu cần
  },
});

export default AvatarImage;
