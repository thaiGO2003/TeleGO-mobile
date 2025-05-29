import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import PrimaryButton from "../../../components/common/PrimaryButton";
import {
  rejectFriendRequest,
  acceptFriendRequest,
  getPendingFriendRequests,
} from "../../../api/services/friendService";
import socket from "../../../utils/socket";

const FriendRequest = ({ visible, onClose, userId, onRequestCountChange }) => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (visible && userId) {
      fetchRequests();
    }

    // Listen for socket events
    socket.on("receiveFriendRequest", fetchRequests);
    socket.on("friendAccepted", fetchRequests);
    socket.on("friendRejected", fetchRequests);

    return () => {
      socket.off("receiveFriendRequest");
      socket.off("friendAccepted");
      socket.off("friendRejected");
    };
  }, [visible, userId]);

  const fetchRequests = async () => {
    try {
      const data = await getPendingFriendRequests(userId);
      setRequests(data);
      if (onRequestCountChange) {
        onRequestCountChange(data.length);
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      Alert.alert("❌", t("friend.errorFetchingRequests"));
    }
  };

  const handleAccept = async (friendId) => {
    try {
      await acceptFriendRequest(userId, friendId);
      Alert.alert("✅", t("friend.requestAccepted"));
      fetchRequests();
    } catch (error) {
      console.error("Error accepting friend request:", error);
      Alert.alert("❌", t("friend.errorAccepting"));
    }
  };

  const handleReject = async (friendId) => {
    try {
      await rejectFriendRequest(userId, friendId);
      Alert.alert("🚫", t("friend.requestRejected"));
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      Alert.alert("❌", t("friend.errorRejecting"));
    }
  };

  const renderItem = ({ item }) => {
    const friend = item.friendInfo;
    return (
      <View style={styles.friendItem}>
        <View style={styles.friendInfo}>
          <Image
            source={{ uri: friend.avatar }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.name}>{friend.fullName}</Text>
            <Text style={styles.phone}>{friend.phoneNumber}</Text>
          </View>
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.circleButton, styles.acceptButton]}
            onPress={() => handleAccept(friend._id)}
          >
            <Ionicons name="checkmark" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.circleButton, styles.rejectButton]}
            onPress={() => handleReject(friend._id)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{t("friend.requests")}</Text>
          <View style={styles.content}>
            {requests.length === 0 ? (
              <Text style={styles.emptyText}>{t("friend.noRequests")}</Text>
            ) : (
              <FlatList
                data={requests}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
              />
            )}
          </View>
          <PrimaryButton title={t("friend.close")} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    height: "70%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  content: {
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#999",
    marginTop: 20,
  },
  listContainer: {
    paddingBottom: 10,
    flexGrow: 1,
  },
  friendItem: {
    paddingVertical: 10,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  friendInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  name: {
    fontWeight: "600",
    fontSize: 16,
  },
  phone: {
    color: "#666",
    marginBottom: 6,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  acceptButton: {
    backgroundColor: "#28a745", // Green for accept
  },
  rejectButton: {
    backgroundColor: "#dc3545", // Red for reject
  },
});

export default FriendRequest;