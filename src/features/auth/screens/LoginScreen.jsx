import React, { useState, useContext, useRef  } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { Alert } from "react-native";
import AuthPrimaryContainer from "../components/AuthPrimaryContainer";
import LogoHeader from "../../../components/layout/LogoHeader";
import FormInput from "../../../components/common/FormInput";
import WhiteButton from "../../../components/common/WhiteButton";
import SpaceDivider from "../../../components/common/SpaceDivider";
import ExplainationText from "../../../components/common/ExplainationText";
import PasswordInputForm from "../components/PasswordInputForm";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { setUser } from "../../../navigation/AppNavigator";
import { signInWithPhoneNumber } from "firebase/auth";
import {
  loginUser,
  getUserByPhoneNumber,
} from "../../../api/services/userService"; // Import the loginUser function
import { auth } from '../../../config/firebaseConfig'; // Đảm bảo bạn import từ đúng file
import { useNavigation } from "@react-navigation/native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";

const LoginScreen = ({}) => {
  const recaptchaVerifier = useRef(null);

    const navigation = useNavigation();
    const { setUser } = useContext(AuthContext);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const { t } = useTranslation();

  const handleLogin = async () => {
    if (!phone || phone.trim() === "") {
      return Alert.alert(t("auth.missingInfo"), t("auth.enterPhoneNumber"));
    }

    if (!/^[0-9]{9,11}$/.test(phone)) {
      return Alert.alert(t("auth.invalidPhone"), t("auth.invalidPhoneFormat"));
    }

    if (!password || password.length < 6) {
      return Alert.alert(t("auth.invalidPassword"), t("auth.passwordMinLength"));
    }

    try {
      let loginRes;
      try {
        loginRes = await loginUser(phone, password);
      } catch (err) {
        if (err.response?.status === 404) {
          return Alert.alert(t("auth.error"), t("auth.accountNotExist")); // 📌 Tài khoản không tồn tại
        }
        if (err.response?.status === 401) {
          return Alert.alert(t("auth.error"), t("auth.incorrectPassword")); // 📌 Mật khẩu không đúng
        }
        return Alert.alert(t("auth.error"), t("auth.loginError")); // 🔁 Lỗi khác
      }
    
      if (loginRes.message !== "Đăng nhập thành công") {
        return Alert.alert(t("auth.error"), t("auth.loginError"));
      }
    
      let userData;
      try {
        userData = await getUserByPhoneNumber(phone);
      } catch (err) {
        if (err.response?.status === 404) {
          return Alert.alert(t("auth.error"), t("auth.userNotFound")); // 📌 Không tìm thấy người dùng
        } else {
          return Alert.alert(t("auth.error"), t("auth.loginError"));
        }
      }
    
      Alert.alert(
        t("auth.loginSuccess"),
        `${t("auth.welcomeBack")}, ${userData.fullName || t("auth.you")}!`,
        [
          {
            text: "OK",
            onPress: async () => {
              await AsyncStorage.setItem("userData", JSON.stringify(userData));
              setUser(userData);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(t("auth.error"), error.message || t("auth.loginError"));
    }    
  };

  const handleRegister = () => {
    navigation.navigate("RegisterCredentials");
  };


  const handleForgotPassword = async () => {
    if (!phone || phone.trim() === "") {
      return Alert.alert(t("auth.missingInfo"), t("auth.enterPhoneNumber"));
    }
  
    if (!/^[0-9]{9,11}$/.test(phone)) {
      return Alert.alert(t("auth.invalidPhone"), t("auth.invalidPhoneFormat"));
    }

    const fullPhoneNumber = `+84${phone.trim().replace(/^0/, "")}`;

  
    try {
        const confirmation = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        recaptchaVerifier.current
      );
  
      // Navigate to OTP screen
      navigation.navigate("ForgotPasswordOTP", {
        phoneNumber: phone,
        verificationId: confirmation.verificationId,
      });
    } catch (error) {
      Alert.alert(t("auth.error"), error.message);
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
      
      <SpaceDivider />
      <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={auth.app.options}
         />

      <FormInput
        label={t("auth.phoneNumber")}
        value={phone}
        onChangeText={setPhone}
        placeholder={t("auth.phonePlaceholder")}
      />

      <PasswordInputForm
        label={t("auth.password")}
        value={password}
        onChangeText={setPassword}
        placeholder={t("auth.passwordPlaceholder")}
        secureTextEntry
      />

      <WhiteButton title={t("auth.login")} onPress={handleLogin} />

      <SpaceDivider />

      <ExplainationText text={t("auth.forgotPasswordText")} />
      <WhiteButton
        title={t("auth.forgotPassword")}
        onPress={handleForgotPassword}
      />

      <ExplainationText text={t("auth.registerText")} />
      <WhiteButton title={t("auth.register")} onPress={handleRegister} />
    </AuthPrimaryContainer>
  );
};

export default LoginScreen;
