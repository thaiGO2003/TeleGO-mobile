import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

const AvatarPicker = ({ avatarUri, avatar, onPickAvatar, onRemoveAvatar, t }) => {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
      }}
    >
      <Image
        source={avatarUri ? { uri: avatarUri } : avatar}
        style={{
          width: 100,
          height: 100,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#ccc",
        }}
      />
      <View style={{ flexDirection: "row", marginTop: 8 }}>
        <TouchableOpacity
          onPress={onPickAvatar}
          style={{ marginRight: 16 }}
        >
          <Text style={styles.chooseImageText}>{t("auth.chooseImage")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRemoveAvatar}>
          <Text style={styles.removeImageText}>{t("auth.removeImage")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chooseImageText: {
    color: "blue", // You can adjust the color as needed
  },
  removeImageText: {
    color: "red",
  },
});

export default AvatarPicker;