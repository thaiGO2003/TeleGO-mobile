import React, { useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next"; // Import useTranslation hook từ react-i18next
import WhiteButton from "../../../components/common/WhiteButton";
import SpaceDivider from "../../../components/common/SpaceDivider";
import AuthPrimaryContainer from "../components/AuthPrimaryContainer";
import LogoHeader from "../../../components/layout/LogoHeader";
import FormInput from "../../../components/common/FormInput";
import ExplainationText from "../../../components/common/ExplainationText";
import { auth } from "../../../config/firebaseConfig"; // Firebase config
import { createUser } from "../../../api/services/userService"; // Import createUser

const RegisterOTPScreen = ({ navigation, route }) => {
  const { t } = useTranslation(); // Sử dụng hook useTranslation để lấy t() cho quốc tế hóa
  const {
    fullName,
    phoneNumber,
    birthDate,
    password,
    avatarUri,
    confirmation,
  } = route.params;
  const [otp, setOtp] = useState("");

  const handleVerifyOTP = async () => {
    try {
      // Xác thực OTP
      await confirmation.confirm(otp);

      Alert.alert(t("auth.success"), t("auth.otpVerificationSuccess"));

      // Tạo người dùng bằng API
      const newUser = await createUser({ password ,phoneNumber });

      // Tiếp tục tới bước đăng ký thông tin cá nhân
      navigation.navigate("RegisterPersonalInfo", {
        fullName,
        phoneNumber,
        birthDate,
        password,
        avatarUri,
      });
    } catch (error) {
      Alert.alert(t("auth.error"), error.message || t("auth.invalidOTP")); // Hiển thị thông báo lỗi từ API
    }
  };

  const handleResendOTP = () => {
    Alert.alert(t("auth.notice"), t("auth.otpResendFeatureComingSoon"));
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
      <ExplainationText text={t("auth.enterOTPMessage")} />

      <FormInput
        label={t("auth.otpLabel")}
        value={otp}
        onChangeText={setOtp}
        placeholder={t("auth.otpPlaceholder")}
        keyboardType="numeric"
      />
      <SpaceDivider />
      <WhiteButton title={t("auth.verifyOTP")} onPress={handleVerifyOTP} />
      <SpaceDivider />
      <WhiteButton title={t("auth.resendOTP")} onPress={handleResendOTP} />
    </AuthPrimaryContainer>
  );
};

export default RegisterOTPScreen;
