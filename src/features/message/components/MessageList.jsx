import React, { useContext, useState, useEffect } from "react";
import {
  ScrollView,
  TouchableOpacity,
  Image,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { useColor } from "../../../context/ColorContext";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../../context/AuthContext";
import { getUserById } from "../../../api/services/userService";
import { useNavigation } from "@react-navigation/native";

const MessageList = ({ data }) => {
  const navigation = useNavigation();
  const { black, grey } = useColor();
  const { t } = useTranslation();
  const [otherUsersInfo, setOtherUsersInfo] = useState({});
  const { user } = useContext(AuthContext);

  // Handle press on a chat item (personal or group)
  const handlePress = (item) => {
    if (item.isGroup) {
      navigation.navigate("Chat", {
        groupId: item.groupId,
        groupName: item.groupName,
        groupMembers: item.groupMembers,
      });
    } else {
      const otherUserIds = item.users?.filter((id) => id !== user._id);
      navigation.navigate("Chat", { otherUserIds });
    }
  };

  // Fetch other users' info for personal chats
  useEffect(() => {
    const fetchOtherUsers = async () => {
      const newInfo = {};
      const personalChats = data.filter(
        (item) => !item.isGroup && item.users?.length === 2
      );
      for (const item of personalChats) {
        const otherUserId = item.users.find((id) => id !== user._id);
        if (otherUserId && !newInfo[item._id]) {
          try {
            const userData = await getUserById(otherUserId);
            newInfo[item._id] = userData;
          } catch (err) {
            if (err?.response?.status !== 404) {
              console.error("Error fetching user data:", err);
            }
          }
        }
      }
      setOtherUsersInfo((prev) => ({ ...prev, ...newInfo }));
    };

    if (user && data.length > 0) fetchOtherUsers();
  }, [data, user]);

  // Render name (group or user)
  const renderName = (item) => {
    if (item.isGroup) {
      return item.groupName || t("message.unknownGroup");
    }
    if (item.users?.length === 2) {
      const otherUser = otherUsersInfo[item._id];
      return otherUser?.fullName || t("message.unknownUser");
    }
    return t("message.unknown");
  };

  // Render avatar (group or user)
  const renderAvatar = (item) => {
    if (item.isGroup) {
      return {
        uri:
          item.avatar ||
          "https://becnmnhom8.s3.ap-southeast-1.amazonaws.com/_WRtPzVMq-group.png",
      };
    }
    if (item.users?.length === 2) {
      const otherUser = otherUsersInfo[item._id];
      if (otherUser?.avatar) {
        return { uri: otherUser.avatar };
      }
      return require("../../../assets/images/default.png");
    }
    return require("../../../assets/images/group.png");
  };

  // Render last message
  const renderLastMessage = (item) => {
    if (item.recalled) return t("message.recalled");
    if (item.message) return item.message;
    if (item.fileUrl) return t("message.fileSent");
    if (item.message === "") return t("");
    return t("message.noContent");
  };

  return (
    <ScrollView style={styles.scrollView}>
      {data
        .filter((item) =>
          !item.isGroup
            ? !item.users?.includes("67fe2028cd930154b9e8e433")
            : true
        )
        .map((item, index) => (
          <TouchableOpacity
            key={item._id}
            style={[
              styles.messageContainer,
              index > 0 && styles.messageSeparator, // Apply separator for all items except the first
            ]}
            onPress={() => handlePress(item)}
          >
            <Image source={renderAvatar(item)} style={styles.avatar} />
            <View style={styles.messageInfo}>
              <View style={styles.rowSpaceBetween}>
                <Text style={[styles.name, { color: black }]}>
                  {renderName(item)}
                </Text>
                <Text style={{ color: grey, fontSize: 12 }}>
                  {new Date(
                    item.createdAt || item.lastMessage?.createdAt || Date.now()
                  ).toLocaleString("vi-VN")}
                </Text>
              </View>
              <Text
                style={[styles.lastMessage, { color: grey }]}
                numberOfLines={1}
              >
                {renderLastMessage(item)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

      {data.length === 0 && (
        <Text style={[styles.noResults, { color: black }]}>
          {t("message.noMessagesOrGroups")}
        </Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    marginBottom: 45,
    width: "100%",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    width: "100%",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  messageInfo: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
  },
  messageSeparator: {
    borderTopWidth: 1, // Add a 1px gray line
    borderTopColor: "#D3D3D3", // Light gray color for the separator
  },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  rowSpaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default MessageList;