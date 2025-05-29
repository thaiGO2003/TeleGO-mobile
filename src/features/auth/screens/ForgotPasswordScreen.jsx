import React, { useState } from "react";
import { Alert } from "react-native";
import AuthPrimaryContainer from "../components/AuthPrimaryContainer";
import LogoHeader from "../../../components/layout/LogoHeader";
import FormInput from "../../../components/common/FormInput"; // Sử dụng FormInput thay vì PasswordInputForm
import WhiteButton from "../../../components/common/WhiteButton";
import SpaceDivider from "../../../components/common/SpaceDivider";
import ExplainationText from "../../../components/common/ExplainationText";
import { useTranslation } from "react-i18next";
import { changePasswordByPhoneNumber } from "../../../api/services/userService"; // Import API service

const ForgotPasswordScreen = ({ navigation, route }) => {
  const { phoneNumber } = route.params;
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleResetPassword = async () => {
    // Validate new password length
    if (newPassword.length < 6) {
      return Alert.alert(t("auth.error"), t("auth.passwordMinLength"));
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return Alert.alert(t("auth.error"), t("auth.passwordMismatch"));
    }

    try {
      // Call the backend to update the password by phone number
      const response = await changePasswordByPhoneNumber(phoneNumber, newPassword);

      // Show success message after password update
      Alert.alert(t("auth.success"), t("auth.passwordUpdated"), [
        {
          text: t("auth.login"),
          onPress: () => navigation.navigate("Login"),
        },
      ]);
    } catch (error) {
      Alert.alert(t("auth.error"), t("auth.passwordVerificationFailed"));
    }
  };

  return (
    <AuthPrimaryContainer
      logoHeader={<LogoHeader logoSource={require("../../../assets/icons/TeleGO.png")} text="TeleGO" />}
    >
      <ExplainationText text={t("auth.forgotPasswordInstruction")} />

      <FormInput
        label={t("auth.newPassword")}
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder={t("auth.newPasswordPlaceholder")}
        secureTextEntry
      />
      <FormInput
        label={t("auth.confirmNewPassword")}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder={t("auth.confirmNewPasswordPlaceholder")}
        secureTextEntry
      />

      <SpaceDivider />
      <WhiteButton title={t("auth.confirm")} onPress={handleResetPassword} />
    </AuthPrimaryContainer>
  );
};

export default ForgotPasswordScreen;
