import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform, Alert } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
const BirthDateChooser = ({ birthDate, setBirthDate }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { t } = useTranslation();

  const handleDateChange = (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }

    const currentDate = selectedDate || new Date();
    const today = new Date();
    const age = today.getFullYear() - currentDate.getFullYear();

    if (age > 130 || age < 10) {
      Alert.alert(t("setting.warning"), t("auth.birthDateWarning"));
      setShowDatePicker(false);
      return;
    }

    setShowDatePicker(Platform.OS === "ios");
    setBirthDate(dayjs(currentDate).format("DD/MM/YYYY"));
    setShowDatePicker(false);
  };

  return (
    <>
      <Text style={styles.label}>{t("setting.birthDate")}</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>
            {birthDate ? birthDate : t("setting.birthDatePlaceholder")}
          </Text>
        </View>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={birthDate ? dayjs(birthDate, "DD/MM/YYYY").toDate() : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </>
  );
};

const styles = {
  label: {
    fontWeight: "bold",
    marginLeft: 15,
    marginBottom: 5,
    color: "black",
    width: "100%",
    textAlign: "left",
  },
  dateContainer: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 15,
    backgroundColor: "#fff",
  },
  dateText: {
    fontSize: 16,
    color: "black",
  },
};

export default BirthDateChooser;