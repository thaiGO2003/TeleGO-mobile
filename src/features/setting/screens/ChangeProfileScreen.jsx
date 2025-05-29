import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";

import FormInput from "../../../components/common/FormInput";
import SpaceDivider from "../../../components/common/SpaceDivider";
import PrimaryButton from "../../../components/common/PrimaryButton";
import CommonWhiteContainer from "../../../components/layout/CommonWhiteContainer";
import LogoHeader from "../../../components/layout/LogoHeader";
import AvatarPicker from "../../../components/specific/AvatarPicker";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import "dayjs/locale/en";
import "dayjs/locale/fr";
import "dayjs/locale/ja";
import { useColor } from "../../../context/ColorContext";
import { updateUserByPhoneNumber } from "../../../api/services/userService";
import { AuthContext } from "../../../context/AuthContext";
import BirthDateChooser from "../../../components/specific/BirthDateChooser";
const ChangeProfileScreen = ({ navigation }) => {
  const { COLORS } = useColor();
  const { t } = useTranslation();
  const { user, setUser } = useContext(AuthContext);

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [avatar, setAvatar] = useState(
    require("../../../assets/images/default.png")
  );
  const [avatarUri, setAvatarUri] = useState(null);
  const [isAvatarChanged, setIsAvatarChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setBirthDate(user.birthDate || "");
      setSelectedGender(user.gender || "");
      setAvatarUri(user.avatar || null);
      setAvatar(
        user.avatar
          ? { uri: user.avatar }
          : require("../../../assets/images/default.png")
      );
    }
  }, [user]);

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("auth.permissionDenied"), t("auth.appNeedsPermission"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
      setAvatar({ uri: result.assets[0].uri });
      setIsAvatarChanged(true);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUri(null);
    setAvatar(require("../../../assets/images/default.png"));
    setIsAvatarChanged(true);
  };

  const validateInputs = () => {
    if (!fullName.trim())
      return { isValid: false, message: t("auth.pleaseEnterFullName") };
    if (!birthDate.trim())
      return { isValid: false, message: t("auth.pleaseEnterBirthDate") };
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate))
      return { isValid: false, message: t("auth.invalidDateFormat") };
    if (!selectedGender)
      return { isValid: false, message: t("auth.pleaseSelectGender") };
    return { isValid: true };
  };

  const handleSaveProfile = async () => {
    const { isValid, message } = validateInputs();
    if (!isValid) {
      Alert.alert(t("auth.error"), message || t("auth.missingInfo"));
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        fullName,
        birthDate,
        gender: selectedGender,
        ...(isAvatarChanged && {
          avatar: avatarUri
            ? {
                uri: avatarUri,
                name: avatarUri.split("/").pop(),
                type: "image/jpeg",
              }
            : null,
        }),
      };

      const updatedUser = {
        ...user,
        ...updateData,
        avatar: avatarUri || user.avatar,
      };

      await updateUserByPhoneNumber(user.phoneNumber, updateData);
      setUser(updatedUser);
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));

      Alert.alert(t("setting.updateSuccess"), t("setting.profileUpdated"), [
        {
          text: "OK",
          onPress: () => {
            setIsLoading(false);
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      setIsLoading(false);
      Alert.alert(t("auth.error"), error.message || t("auth.errorMessage"));
    }
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
      <FormInput
        label={t("setting.fullName")}
        value={fullName}
        onChangeText={setFullName}
        placeholder={t("auth.fullNamePlaceholder")}
        labelStyle={styles.label}
      />

      <SpaceDivider />

      <BirthDateChooser birthDate={birthDate} setBirthDate={setBirthDate} />


      <SpaceDivider />

      <Text style={styles.label}>{t("setting.gender")}</Text>
      <View style={styles.radioContainer}>
        {["male", "female"].map((gender) => (
          <TouchableOpacity
            key={gender}
            style={styles.radioItem}
            onPress={() => setSelectedGender(gender)}
          >
            <View
              style={[
                styles.radioOuterCircle,
                selectedGender === gender && { borderColor: COLORS.primary },
              ]}
            >
              <View
                style={[
                  styles.radioInnerCircle,
                  selectedGender === gender && {
                    backgroundColor: COLORS.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.radioLabel}>{t(`setting.${gender}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SpaceDivider />

      <Text style={styles.label}>{t("auth.avatar")}</Text>
      <AvatarPicker
        avatarUri={avatarUri}
        avatar={avatar}
        onPickAvatar={handlePickAvatar}
        onRemoveAvatar={handleRemoveAvatar}
        t={t}
      />

      <SpaceDivider />

      <PrimaryButton
        title={
          isLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            t("setting.saveChanges")
          )
        }
        onPress={handleSaveProfile}
        disabled={isLoading}
      />
    </CommonWhiteContainer>
  );
};

const styles = StyleSheet.create({
  label: {
    fontWeight: "bold",
    marginLeft: 15,
    marginBottom: 5,
    color: "black",
    width: "100%",
    textAlign: "left",
  },
  radioContainer: {
    flexDirection: "row",
    marginTop: 10,
    marginLeft: 15,
    marginBottom: 10,
  },
  radioItem: {
    flexDirection: "row",
    marginRight: 20,
    alignItems: "center",
  },
  radioOuterCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "gray",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  radioInnerCircle: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: "transparent",
  },
  radioLabel: {
    fontSize: 16,
    color: "black",
  },
});

export default ChangeProfileScreen;
