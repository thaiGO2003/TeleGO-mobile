import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { View, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import { useColor } from "../../context/ColorContext";

const SearchBar = ({ search, setSearch, handleSearch }) => {
  const { t } = useTranslation();
  const { COLORS } = useColor();

  return (
    <View
      style={{
        marginHorizontal: 22,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primary,
        height: 48,
        marginVertical: 22,
        paddingHorizontal: 12,
        borderRadius: 20,
      }}
    >
      <Ionicons
        name="search-outline"
        size={24}
        color={COLORS.white}
        onPress={handleSearch}
      />
      <TextInput
        style={{
          width: "100%",
          height: "100%",
          marginHorizontal: 12,
          color: COLORS.white,
        }}
        onChangeText={setSearch}
        value={search}
        placeholder={t("message.searchPlaceholder")}
        placeholderTextColor={COLORS.white}
      />
    </View>
  );
};

export default SearchBar;
