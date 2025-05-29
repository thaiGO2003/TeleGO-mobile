import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useTranslation } from "react-i18next";

import LogoHeader from "../../../components/layout/LogoHeader";
import CommonWhiteContainer from "../../../components/layout/CommonWhiteContainer";
import { useColor } from "../../../context/ColorContext";
const colorOptions = [
  { name: "Red", value: "#FF0000" },
  { name: "Light Red", value: "#FFA3A3" },

  { name: "Orange", value: "#FF7F00" },
  { name: "Light Orange", value: "#FFD1A3" },

  { name: "Yellow", value: "#FFFF00" },
  { name: "Light Yellow", value: "#FFFFCC" },

  { name: "Green", value: "#4CAF50" },
  { name: "Light Green", value: "#A8E6A3" },

  { name: "Blue", value: "#0000FF" },
  { name: "Light Blue", value: "#A3C9FF" },

  { name: "Indigo", value: "#4B0082" },
  { name: "Light Indigo", value: "#C3B1E1" },

  { name: "Violet", value: "#8B00FF" },
  { name: "Light Violet", value: "#D6A3FF" },

  { name: "White", value: "#FFFFFF" },
  { name: "Black", value: "#000000" },

  { name: "Transparent", value: "transparent" },
];

const ChangeSystemAppearanceScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { COLORS, setPrimaryColor } = useColor();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
    Alert.alert(
      t("setting.notice"),
      t("setting.languageChanged"),
      [{ text: "OK" }],
      { cancelable: false }
    );
  };

  const handleColorChange = (color) => {
    setPrimaryColor(color);
  };

  return (
    <CommonWhiteContainer
      logoHeader={
        <LogoHeader
          logoSource={require("../../../assets/icons/TeleGO.png")}
          text="TeleGO"
        />
      }
    >
      <Text style={[styles.title, { color: COLORS.black }]}>
        {t("setting.chooseLanguage")}
      </Text>

      {/* Language Selection */}
      {["vi", "en", "fr", "ja"].map((lang) => (
        <TouchableOpacity
          key={lang}
          style={[
            styles.languageOption,
            { backgroundColor: COLORS.white },
            selectedLanguage === lang && {
              borderColor: COLORS.primary,
              borderWidth: 2,
            },
          ]}
          onPress={() => handleLanguageChange(lang)}
        >
          <Text style={[styles.languageText, { color: COLORS.primary }]}>
            {lang === "vi"
              ? "Tiếng Việt"
              : lang === "en"
              ? "English"
              : lang === "fr"
              ? "Français"
              : lang === "ja"
              ? "日本語"
              : lang}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Primary Color Selection */}
      <Text style={[styles.title, { color: COLORS.black }]}>
        {t("setting.chooseColor") || "Chọn màu giao diện"}
      </Text>

      <View style={styles.colorContainer}>
        {colorOptions.map((color) => (
          <TouchableOpacity
            key={color.value}
            onPress={() => handleColorChange(color.value)}
            style={[
              styles.colorCircle,
              {
                backgroundColor: color.value,
                borderColor:
                  COLORS.primary === color.value ? COLORS.black : "transparent",
                borderWidth: 2,
              },
            ]}
          />
        ))}
      </View>
    </CommonWhiteContainer>
  );
};

const styles = StyleSheet.create({
  title: {
    width: "100%",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "left",
    marginVertical: 20,
    lineHeight: 24,
  },
  languageOption: {
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  languageText: {
    fontSize: 16,
    textAlign: "center",
  },
  colorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    flexWrap: "wrap",
    gap: 10,
    width: "90%",
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
  },
});

export default ChangeSystemAppearanceScreen;
