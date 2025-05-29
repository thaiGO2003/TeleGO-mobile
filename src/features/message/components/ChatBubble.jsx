import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
} from "react-native";
import { AuthContext } from "../../../context/AuthContext";

const ChatBubble = ({ role, text }) => {
  const isUser = role === "user";
  const { user } = useContext(AuthContext);

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.modelContainer,
      ]}
    >
      {!isUser && (
        <Image
          source={require("../../../assets/icons/Gemini.png")} // sửa lại đường dẫn nếu cần
          style={styles.avatar}
        />
      )}

      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.modelBubble,
        ]}
      >
        <Text style={styles.text}>{text}</Text>
      </View>

      {isUser && (
        <Image
          source={user.avatar} // sửa lại đường dẫn nếu cần
          style={styles.avatar}
        />
      )}
    </View>
  );
};

export default ChatBubble;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: 6,
    alignItems: "flex-end",
    maxWidth: "100%",
  },
  userContainer: {
    justifyContent: "flex-end",
    alignSelf: "flex-end",
  },
  modelContainer: {
    justifyContent: "flex-start",
    alignSelf: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#007AFF",
    marginRight: 8,
    borderBottomRightRadius: 4,
  },
  modelBubble: {
    backgroundColor: "#e0e0e0",
    marginLeft: 8,
    borderBottomLeftRadius: 4,
  },
  text: {
    color: "#000",
    fontSize: 15,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});
