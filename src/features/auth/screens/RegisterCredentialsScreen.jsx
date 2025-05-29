import React, { useRef, useState } from "react";
import { View, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { STRINGS } from "../../../constants/strings";
import SpaceDivider from "../../../components/common/SpaceDivider";
import WhiteButton from "../../../components/common/WhiteButton";
import ExplainationText from "../../../components/common/ExplainationText";
import PasswordInputForm from "../components/PasswordInputForm";
import FormInput from "../../../components/common/FormInput";
import AuthPrimaryContainer from "../components/AuthPrimaryContainer";
import LogoHeader from "../../../components/layout/LogoHeader";

import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { auth } from "../../../config/firebaseConfig";
import { signInWithPhoneNumber } from "firebase/auth";
import { getUserByPhoneNumber } from "../../../api/services/userService"; // Import hàm kiểm tra số điện thoại
import { LogBox } from 'react-native';

// Suppress specific warning
LogBox.ignoreLogs(['Warning: FirebaseRecaptcha: Support for defaultProps']);
LogBox.ignoreLogs(['Warning: FirebaseRecaptcha: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.']);

const RegisterCredentialsScreen = ({ navigation, route }) => {
 const { t } = useTranslation();
 const [phoneNumber, setPhoneNumber] = useState("");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [hidePass, setHidePass] = useState(true);
 const [hideConfirmPass, setHideConfirmPass] = useState(true);

 const recaptchaVerifier = useRef(null);

 const handleNext = async () => {
    const trimmedPhone = phoneNumber.trim();
  
    if (!trimmedPhone) {
     return Alert.alert(t("auth.error"), t("auth.enterPhoneNumber"), [{ text: "OK" }]);
    }
  
    if (!/^(0|\+84)[0-9]{9}$/.test(trimmedPhone)) {
     return Alert.alert(t("auth.error"), t("auth.invalidPhoneFormat"), [{ text: "OK" }]);
    }
  
    if (!password) {
     return Alert.alert(t("auth.error"), t("auth.enterPassword"), [{ text: "OK" }]);
    }
  
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
     return Alert.alert(t("auth.error"), t("auth.invalidPasswordFormat"), [{ text: "OK" }]);
    }
  
    if (password !== confirmPassword) {
     return Alert.alert(t("auth.error"), t("auth.passwordMismatch"), [{ text: "OK" }]);
    }
  
    try {
      // Kiểm tra số điện thoại đã tồn tại trong cơ sở dữ liệu chưa
      try {
        const existingUser = await getUserByPhoneNumber(trimmedPhone);
        if (existingUser) {
          return Alert.alert(t("auth.error"), t("auth.phoneAlreadyExists"), [{ text: "OK" }]);
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          return Alert.alert(t("auth.error"), t("auth.phoneCheckError"), [{ text: "OK" }]);
        }
        // Nếu status là 404, user không tồn tại -> tiếp tục quy trình
      }
    
      const fullPhoneNumber = `+84${trimmedPhone.replace(/^0/, "")}`;
    
      const confirmation = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        recaptchaVerifier.current
      );
    
      navigation.navigate("RegisterOTP", {
        ...route.params,
        phoneNumber: trimmedPhone,
        password,
        confirmation,
      });
    } catch (error) {
      Alert.alert(t("auth.otpSendError"), error.message, [{ text: "OK" }]);
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
   <FirebaseRecaptchaVerifierModal
    ref={recaptchaVerifier}
    firebaseConfig={auth.app.options}
   />

   <FormInput
    label={t("auth.phoneNumber")}
    value={phoneNumber}
    onChangeText={setPhoneNumber}
    placeholder={t("auth.phonePlaceholder")}
    keyboardType="phone-pad"
   />
   <ExplainationText text={t("auth.phoneExplanation")} />
   <SpaceDivider />

   <PasswordInputForm
    label={t("auth.password")}
    value={password}
    onChangeText={setPassword}
    placeholder={t("auth.passwordPlaceholder")}
    secureTextEntry={hidePass}
   />
   <ExplainationText text={t("auth.passwordExplanation")} />
   <SpaceDivider />

   <PasswordInputForm
    label={t("auth.confirmPassword")}
    value={confirmPassword}
    onChangeText={setConfirmPassword}
    placeholder={t("auth.confirmPasswordPlaceholder")}
    secureTextEntry={hideConfirmPass}
   />
   <ExplainationText text={t("auth.confirmPasswordExplanation")} />
   <SpaceDivider />

   <WhiteButton title={t("auth.continue")} onPress={handleNext} />
  </AuthPrimaryContainer>
 );
};

export default RegisterCredentialsScreen;