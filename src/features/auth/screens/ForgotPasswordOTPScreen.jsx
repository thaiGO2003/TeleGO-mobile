import React, { useState } from "react";
import { Alert } from "react-native";
import AuthPrimaryContainer from "../components/AuthPrimaryContainer";
import LogoHeader from "../../../components/layout/LogoHeader";
import FormInput from "../../../components/common/FormInput";
import WhiteButton from "../../../components/common/WhiteButton";
import SpaceDivider from "../../../components/common/SpaceDivider";
import ExplainationText from "../../../components/common/ExplainationText";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { auth, firestore } from "../../../config/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";

const ForgotPasswordOTPScreen = ({ navigation, route }) => {
 const { t } = useTranslation();
 const { phoneNumber, verificationId, newPassword } = route.params;
 const [otp, setOtp] = useState("");

 const handleConfirmOTP = async () => {
    if (!otp || otp.length < 6) {
      return Alert.alert(t('auth.error'), t('auth.invalidOtp'));
    }
  
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await signInWithCredential(auth, credential);
  
      // OTP hợp lệ → chuyển đến ForgotPasswordScreen
      navigation.navigate("ForgotPassword", { phoneNumber });
    } catch (error) {
      Alert.alert(t('auth.error'), t('auth.otpFailed'));
    }
  };
  

 return (
  <AuthPrimaryContainer
   logoHeader={<LogoHeader logoSource={require("../../../assets/icons/TeleGO.png")} text="TeleGO" />}
  >
   <ExplainationText text={t('auth.otpInstruction')} />

   <FormInput
    label={t('auth.otp')}
    value={otp}
    onChangeText={setOtp}
    placeholder={t('auth.otpPlaceholder')}
    keyboardType="numeric"
   />

   <SpaceDivider />
   <WhiteButton title={t('auth.confirmOtp')} onPress={handleConfirmOTP} />
  </AuthPrimaryContainer>
 );
};

export default ForgotPasswordOTPScreen;