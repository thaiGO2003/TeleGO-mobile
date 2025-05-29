import React, { useContext } from "react";
import { View } from "react-native";
import {
  AntDesign,
  Ionicons,
  MaterialCommunityIcons,
  Entypo,
  Octicons,
  Feather,
} from "@expo/vector-icons";
import { logoutUser } from "../../../api/services/userService";

import PrimaryButton from "../../../components/common/PrimaryButton";
import CommonWhiteContainer from "../../../components/layout/CommonWhiteContainer";
import SettingOption from "../components/SettingOption";
import { useColor } from "../../../context/ColorContext";
import { useTranslation } from "react-i18next";
import MiniProfile from "../../../components/specific/MiniProfile";
import { AuthContext } from "../../../context/AuthContext";

const SettingScreen = ({ navigation }) => {
  const { COLORS } = useColor();
  const { user, setUser } = useContext(AuthContext);
  const { t } = useTranslation();

  const settingOptions = [
    {
      icon: "user",
      label: t("setting.profile"),
      IconComponent: AntDesign,
      screen: "Profile",
    },
    {
      icon: "paintbrush",
      label: t("setting.languageAndAppearance"),
      IconComponent: Octicons,
      screen: "ChangeSystemAppearance",
    }
  ];

  return (
    <CommonWhiteContainer>
      <MiniProfile
        avatar={user?.avatar}
        fullName={user?.fullName}
        phoneNumber={user?.phoneNumber}
        styleType={2}
      />

      <View style={{ marginVertical: 20, backgroundColor: COLORS.white, width: "100%" }}>
        {settingOptions.map((option, index) => (
          <SettingOption
            key={index}
            icon={option.icon}
            label={option.label}
            IconComponent={option.IconComponent}
            onPress={() => navigation.navigate(option.screen)}
          />
        ))}
      </View>

      <PrimaryButton
        title={t("setting.logout")}
        onPress={async () => {
          await logoutUser(user?._id);
          setUser(null);
        }}
      />

      <PrimaryButton
        title={t("setting.changePassword")}
        onPress={() => navigation.navigate("ChangePassword")}
      />
    </CommonWhiteContainer>
  );
};

export default SettingScreen;
