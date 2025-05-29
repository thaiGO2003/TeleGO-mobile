import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import { useColor } from "../../context/ColorContext";
import { MaterialIcons } from "@expo/vector-icons";

const MiniProfile = ({ avatar, fullName, phoneNumber, styleType = 1, status }) => {
  const { COLORS } = useColor();
  const [imageError, setImageError] = useState(false);

  const avatarSource = imageError
    ? require("../../assets/images/default.png")
    : { uri: avatar };

  const imageComponent = (
    <Image
      source={avatarSource}
      onError={() => setImageError(true)}
      style={{
        width: 45,
        height: 45,
        borderRadius: 22.5,
        marginRight: styleType === 2 ? 16 : 0,
        marginBottom: styleType === 1 ? 8 : 0,
      }}
    />
  );

  const isOnline = status === "online";

  return styleType === 1 ? (
    <View style={{ width: "100%", alignItems: "center", paddingTop: 20 }}>
      {imageComponent}
      <Text style={{ fontSize: 16, fontWeight: "500" }}>{fullName}</Text>
      <Text style={{ fontSize: 14, color: COLORS.gray }}>{phoneNumber}</Text>
    </View>
  ) : (
    <View
      style={{
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 20,
      }}
    >
      {imageComponent}
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
          <Text style={{ fontSize: 16, fontWeight: "500" }}>{fullName}</Text>
          {isOnline && (
            <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}>
              <MaterialIcons name="circle" size={10} color="green" />
              <Text style={{ marginLeft: 4, color: "green", fontSize: 12 }}>Online</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 14, color: COLORS.gray }}>{phoneNumber}</Text>
      </View>
    </View>
  );
};

export default MiniProfile;
