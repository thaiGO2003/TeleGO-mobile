import React from "react";
import { View, Platform } from "react-native";
import { useColor } from "../../context/ColorContext";

const ChatContainer = ({ children }) => {
  const { COLORS } = useColor();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.primary, // Giữ nền trắng nếu cần
        paddingBottom: Platform.OS === "ios" ? 30 : 20, // Tăng padding để tránh lún xuống
      }}
    >
      {children}
    </View>
  );
};

export default ChatContainer;