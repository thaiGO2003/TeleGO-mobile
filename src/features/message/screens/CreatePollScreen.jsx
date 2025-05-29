import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { createPoll } from "../../../api/services/messageService";
import { AuthContext } from "../../../context/AuthContext";

const CreatePollScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const { groupId } = route.params;
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([{ text: "" }, { text: "" }]);

  const addOption = () => {
    if (options.length >= 5) {
      Alert.alert("Lỗi", "Tối đa 5 tùy chọn.");
      return;
    }
    setOptions([...options, { text: "" }]);
  };

  const updateOption = (index, text) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  const removeOption = (index) => {
    if (options.length <= 2) {
      Alert.alert("Lỗi", "Phải có ít nhất 2 tùy chọn.");
      return;
    }
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleCreatePoll = async () => {
    console.log("Creating poll:", { question, options });
    if (!question.trim()) {
      Alert.alert("Lỗi", "Câu hỏi không được để trống.");
      return;
    }
    if (question.length > 200) {
      Alert.alert("Lỗi", "Câu hỏi không được vượt quá 200 ký tự.");
      return;
    }
    if (options.some((opt) => !opt.text.trim())) {
      Alert.alert("Lỗi", "Tất cả tùy chọn phải có nội dung.");
      return;
    }
    if (options.some((opt) => opt.text.length > 100)) {
      Alert.alert("Lỗi", "Tùy chọn không được vượt quá 100 ký tự.");
      return;
    }

    try {
      await createPoll(user._id, groupId, question, options);
      navigation.goBack();
    } catch (error) {
      console.error("Error creating poll:", error);
      Alert.alert("Lỗi", error.message || "Không thể tạo khảo sát.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.label}>{t("poll.question")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("poll.questionPlaceholder")}
          value={question}
          onChangeText={setQuestion}
          maxLength={200}
        />
        <Text style={styles.label}>{t("poll.options")}</Text>
        {options.map((option, index) => (
          <View key={index} style={styles.optionContainer}>
            <TextInput
              style={styles.optionInput}
              placeholder={`${t("poll.option")} ${index + 1}`}
              value={option.text}
              onChangeText={(text) => updateOption(index, text)}
              maxLength={100}
            />
            {options.length > 2 && (
              <TouchableOpacity
                style={styles.removeOptionButton}
                onPress={() => removeOption(index)}
              >
                <Ionicons name="close-circle" size={24} color="#E74C3C" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
          <Text style={styles.addOptionText}>{t("poll.addOption")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            console.log("Create button pressed");
            handleCreatePoll();
          }}
        >
          <Text style={styles.createButtonText}>{t("poll.createButton")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECEF",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginLeft: 10,
  },
  content: {
    padding: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E8ECEF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E8ECEF",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  removeOptionButton: {
    marginLeft: 8,
  },
  addOptionButton: {
    padding: 10,
    backgroundColor: "#E8ECEF",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  addOptionText: {
    fontSize: 16,
    color: "#2C3E50",
  },
  createButton: {
    backgroundColor: "#3797F0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

export default CreatePollScreen;
