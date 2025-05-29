import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from "react-native";
import axios from "axios";
import ChatBubble from "./ChatBubble";

const { width, height } = Dimensions.get("window");

const GeminiChatModal = ({ visible, onClose }) => {
  const [chat, setChat] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);

  const API_KEY = "AIzaSyAgMJvPejib_ZckTz3p8sJCLguvEu6hlTA";

  const handleUserInput = async () => {
    const contents = chat.map((item) => ({
      role: item.role,
      parts: item.parts.map((part) => ({ text: part.text })),
    }));

    contents.push({
      role: "user",
      parts: [{ text: userInput }],
    });

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
        { contents }
      );

      const modelResponse =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (modelResponse) {
        const updatedChatWithModel = [
          ...chat,
          { role: "user", parts: [{ text: userInput }] },
          { role: "model", parts: [{ text: modelResponse }] },
        ];

        setChat(updatedChatWithModel);
        setUserInput("");
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderChatItem = ({ item }) => (
    <ChatBubble role={item.role} text={item.parts[0].text} />
  );

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View ref={modalRef} style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Gemini Chatbot</Text>
              </View>

              <FlatList
                data={chat}
                renderItem={renderChatItem}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.chatContainer}
              />

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Type your message..."
                  placeholderTextColor="#aaa"
                  value={userInput}
                  onChangeText={setUserInput}
                />
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleUserInput}
                >
                  <Text style={styles.buttonText}>Send</Text>
                </TouchableOpacity>
              </View>

              {loading && (
                <ActivityIndicator style={styles.loading} color="#333" />
              )}
              {error && <Text style={styles.error}>{error}</Text>}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default GeminiChatModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.5,  
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  chatContainer: {
    flexGrow: 1,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 45,
    paddingHorizontal: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: "#f8f8f8",
  },
  button: {
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 20,
    marginLeft: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loading: {
    marginTop: 10,
  },
  error: {
    color: "red",
    marginTop: 10,
  },
});
