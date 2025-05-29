import React, { useContext } from "react";
import { ScrollView, TouchableOpacity, View, Alert } from "react-native";
import MiniProfile from "../../../components/specific/MiniProfile";
import { MaterialIcons, Feather, Ionicons } from "@expo/vector-icons"; // Added Ionicons
import { useTranslation } from "react-i18next"; // Added for translations
import { ZEGO_BASE_URL } from "../../../config";
import { AuthContext } from "../../../context/AuthContext";
import * as WebBrowser from "expo-web-browser";
import { unfriendUser } from "../../../api/services/friendService";

const FriendList = ({ data, onPressItem, navigation, onUnfriend }) => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation(); // Added for translations

  const handleUnfriend = (friendId) => {
    Alert.alert(
      t("friend.confirmUnfriendTitle"),
      t("friend.confirmUnfriendMessage"),
      [
        {
          text: t("friend.cancel"),
          style: "cancel",
        },
        {
          text: t("friend.confirm"),
          onPress: async () => {
            try {
              await unfriendUser(user._id, friendId);
              Alert.alert("✅", t("friend.unfriendSuccess"));
              onUnfriend && onUnfriend(); // Refresh friend list
            } catch (error) {
              console.error("Error unfriending:", error);
              Alert.alert("❌", t("friend.unfriendError"));
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleViewProfile = (friendId) => {
    navigation.navigate("Profile", { userId: friendId });
  };

  return (
    <ScrollView
      style={{ width: "100%" }}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      {data.map((item, index) => {
        const friend = item.friendInfo;
        return (
          <TouchableOpacity
            key={item._id || index}
            onPress={() => navigation.navigate("Chat", { otherUserIds: [friend._id] })}
            style={{
              paddingVertical: index === 0 ? 0 : 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MiniProfile
                avatar={friend?.avatar}
                fullName={friend?.fullName}
                phoneNumber={friend?.phoneNumber}
                status={friend?.status}
                styleType={2}
              />
            </View>

            <View
              style={{
                marginTop: 10,
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
                marginRight: 8,
              }}
            >
              <TouchableOpacity onPress={() => handleViewProfile(friend._id)}>
                <Ionicons name="eye" size={30} color="purple" /> {/* Eye icon */}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Chat", { otherUserIds: [friend._id] })
                }
              >
                <MaterialIcons name="message" size={30} color="dodgerblue" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const ids = [user._id, friend._id].sort();
                  const roomID = `room-${ids[0]}-${ids[1]}`;
                  const videoCallUrl =
                    ZEGO_BASE_URL + `?roomID=${roomID}&userID=${user._id}`;
                  WebBrowser.openBrowserAsync(videoCallUrl);
                }}
              >
                <Feather name="video" size={30} color="green" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleUnfriend(friend._id)}>
                <MaterialIcons name="person-remove" size={30} color="red" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default FriendList;