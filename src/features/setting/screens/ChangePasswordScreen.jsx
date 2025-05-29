import React, { useState, useContext } from "react";
import { Alert } from "react-native";
import LogoHeader from "../../../components/layout/LogoHeader";
import FormInput from "../../../components/common/FormInput";
import WhiteButton from "../../../components/common/WhiteButton";
import ExplainationText from "../../../components/common/ExplainationText";
import CommonWhiteContainer from "../../../components/layout/CommonWhiteContainer";
import { useTranslation } from "react-i18next";
import { changePassword } from "../../../api/services/userService";
import PrimaryButton from "../../../components/common/PrimaryButton";
import { AuthContext } from "../../../context/AuthContext"; // ✅ Import AuthContext

const ChangePassordScreen = ({ navigation }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { user } = useContext(AuthContext); // ✅ Lấy user từ context
  const { t } = useTranslation();

  const passwordRegex =
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert(t("setting.error"), t("setting.missingInfo"));
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      Alert.alert(t("setting.error"), t("setting.invalidPasswordFormat"));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t("setting.error"), t("setting.passwordMismatch"));
      return;
    }

    try {
      await changePassword(user._id, oldPassword, newPassword);
      Alert.alert(t("setting.success"), t("setting.passwordUpdated"));
      navigation.goBack();
    } catch (err) {
      Alert.alert(t("setting.error"), t("setting.passwordVerificationFailed"));
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
        label={t("setting.oldPassword")}
        value={oldPassword}
        onChangeText={setOldPassword}
        placeholder={t("setting.enterOldPassword")}
        labelStyle={{ color: "black" }}
        secureTextEntry
      />
      <ExplainationText
        text={t("setting.enterOldPasswordExplain")}
        style={{ color: "black" }}
      />

      <FormInput
        label={t("setting.newPassword")}
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder={t("setting.enterNewPassword")}
        labelStyle={{ color: "black" }}
        secureTextEntry
      />
      <ExplainationText
        text={t("setting.enterNewPasswordExplain")}
        style={{ color: "black" }}
      />

      <FormInput
        label={t("setting.confirmPassword")}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder={t("setting.enterConfirmPassword")}
        labelStyle={{ color: "black" }}
        secureTextEntry
      />
      <ExplainationText
        text={t("setting.enterConfirmPasswordExplain")}
        style={{ color: "black" }}
      />

      <PrimaryButton title={t("setting.save")} onPress={handleChangePassword} />
    </CommonWhiteContainer>
  );
};

export default ChangePassordScreen;
