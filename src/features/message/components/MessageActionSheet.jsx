import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { useColor } from "../../../context/ColorContext";

const MessageActionSheet = ({
  isVisible,
  onClose,
  options,
  onSelect,
  message,
  emojiOptions,
  onEmojiSelect,
}) => {
  const { COLORS } = useColor();

  const handleOptionPress = (value) => {
    onSelect(value, message);
    onClose();
  };

  const handleEmojiPress = (emoji) => {
    onEmojiSelect(emoji, message);
    onClose();
  };

  const styles = StyleSheet.create({
    background: {
      flex: 1, // Make background take full screen to handle touch events
      justifyContent: "flex-end",
      alignItems: "center",
    },
    container: {
      width: "95%",
      borderRadius: 10,
      marginBottom: 20,
      padding: 10,
      backgroundColor: COLORS.primary,
      borderColor: "white",
      borderWidth: 2,
    },
    messagePreview: {
      padding: 10,
      marginBottom: 10,
      borderRadius: 5,
      backgroundColor: "#f0f0f0",
    },
    emojiRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: "#eee",
    },
    emojiLabel: {
      marginRight: 10,
      fontSize: 16,
      color: COLORS.text,
    },
    emojiButton: {
      padding: 5,
      marginHorizontal: 5,
      borderRadius: 15,
      backgroundColor: "#e0e0e0",
    },
    emojiText: {
      fontSize: 18,
    },
    optionButton: {
      padding: 15,
    },
    optionText: {
      fontSize: 18,
      color: COLORS.text,
    },
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.background}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {message && message.text && (
                <View style={styles.messagePreview}>
                  <Text style={{ color: COLORS.text }}>{message.text}</Text>
                </View>
              )}

              {emojiOptions && emojiOptions.length > 0 && (
                <View style={styles.emojiRow}>
                  <Text style={styles.emojiLabel}>Phản ứng nhanh:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {emojiOptions.map((emoji, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.emojiButton}
                        onPress={() => handleEmojiPress(emoji)}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <ScrollView>
                {options &&
                  options.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.optionButton}
                      onPress={() => handleOptionPress(option)}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default MessageActionSheet;