import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";

import FormInput from "../../../components/common/FormInput";
import ExplainationText from "../../../components/common/ExplainationText";
import SpaceDivider from "../../../components/common/SpaceDivider";
import WhiteButton from "../../../components/common/WhiteButton";
import AuthPrimaryContainer from "../components/AuthPrimaryContainer";
import LogoHeader from "../../../components/layout/LogoHeader";
import AvatarPicker from "../../../components/specific/AvatarPicker";
import { useColor } from "../../../context/ColorContext";
import { updateUserByPhoneNumber } from "../../../api/services/userService";
import BirthDateChooser from "../../../components/specific/BirthDateChooser";

const RegisterPersonalInfoScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { COLORS } = useColor();
  const styles = getStyles(COLORS);

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [avatar, setAvatar] = useState(
    require("../../../assets/images/default.png")
  );
  const [avatarUri, setAvatarUri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUri(null);
    setAvatar(require("../../../assets/images/default.png"));
  };

  const validateInputs = () => {
    let isValid = true;
    let message = "";

    if (!fullName.trim()) {
      message = t("auth.pleaseEnterFullName");
      isValid = false;
    } else if (!birthDate.trim()) {
      message = t("auth.pleaseEnterBirthDate");
      isValid = false;
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) {
      message = t("auth.invalidDateFormat");
      isValid = false;
    } else if (!selectedGender) {
      message = t("auth.pleaseSelectGender");
      isValid = false;
    }

    return { isValid, message };
  };

  const handleNext = async () => {
    const { isValid, message } = validateInputs();
    if (!isValid) {
      Alert.alert(t("auth.error"), message || t("auth.missingInfo"));
      return;
    }

    setIsLoading(true);
    try {
      let avatarFile = null;
      if (avatarUri) {
        avatarFile = {
          uri: avatarUri,
          name: avatarUri.split("/").pop(),
          type: "image/jpeg",
        };
      }

      const updateData = {
        fullName,
        birthDate,
        gender: selectedGender,
        avatar: avatarFile,
      };

      await updateUserByPhoneNumber(route.params.phoneNumber, updateData);

      Alert.alert(t("auth.success"), t("auth.successMessage"), [
        {
          text: "OK",
          onPress: () => {
            setFullName("");
            setBirthDate("");
            setSelectedGender("");
            setAvatarUri(null);
            setIsLoading(false);
            navigation.navigate("Login");
          },
        },
      ]);
    } catch (error) {
      setIsLoading(false);
      Alert.alert(t("auth.error"), error.message || t("auth.errorMessage"));
    }
  };

  return (
    <AuthPrimaryContainer
      logoHeader={
        <LogoHeader
          logoSource={require("../../../assets/icons/TeleGO.png")}
          text="TeleGO"
        />
      }
    >
      <FormInput
        label={t("auth.fullName")}
        value={fullName}
        onChangeText={setFullName}
        placeholder={t("auth.fullNamePlaceholder")}
      />
      <ExplainationText text={t("auth.fullNameExplanation")} />
      <SpaceDivider />

      <BirthDateChooser birthDate={birthDate} setBirthDate={setBirthDate} />
      <ExplainationText text={t("auth.birthDateExplanation")} />
      <SpaceDivider />

      <Text style={styles.label}>{t("auth.gender")}</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={styles.radioItem}
          onPress={() => setSelectedGender("male")}
        >
          <View
            style={[
              styles.radioOuterCircle,
              selectedGender === "male" && styles.selectedOuterCircle,
            ]}
          >
            <View
              style={[
                styles.radioInnerCircle,
                selectedGender === "male" && styles.selectedInnerCircle,
              ]}
            />
          </View>
          <Text style={styles.radioLabel}>{t("auth.male")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioItem}
          onPress={() => setSelectedGender("female")}
        >
          <View
            style={[
              styles.radioOuterCircle,
              selectedGender === "female" && styles.selectedOuterCircle,
            ]}
          >
            <View
              style={[
                styles.radioInnerCircle,
                selectedGender === "female" && styles.selectedInnerCircle,
              ]}
            />
          </View>
          <Text style={styles.radioLabel}>{t("auth.female")}</Text>
        </TouchableOpacity>
      </View>

      <ExplainationText text={t("auth.genderExplanation")} />
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

      <WhiteButton
        title={
          isLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            t("auth.continue")
          )
        }
        onPress={handleNext}
        disabled={isLoading}
      />
    </AuthPrimaryContainer>
  );
};

const getStyles = (COLORS) =>
  StyleSheet.create({
    label: {
      fontWeight: "bold",
      marginLeft: 15,
      marginBottom: 5,
      color: COLORS.white,
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
    },
    radioOuterCircle: {
      height: 20,
      width: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: COLORS.white,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 5,
    },
    radioInnerCircle: {
      height: 12,
      width: 12,
      borderRadius: 6,
      backgroundColor: COLORS.white,
      display: "none",
    },
    selectedOuterCircle: {
      borderColor: COLORS.white,
    },
    selectedInnerCircle: {
      display: "flex",
      backgroundColor: COLORS.white,
    },
    radioLabel: {
      fontSize: 16,
      color: COLORS.white,
    },
  });

export default RegisterPersonalInfoScreen;
