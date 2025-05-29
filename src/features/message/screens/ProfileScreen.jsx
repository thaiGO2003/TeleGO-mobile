import React, { useContext, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import ProfileInfo from "./ProfileInfo";
import CommonWhiteContainer from "../../../components/layout/CommonWhiteContainer";
import PrimaryButton from "../../../components/common/PrimaryButton";
import AvatarImage from "../../../components/common/AvatarImage";
import { getUserQRById, getUserById } from "../../../api/services/userService";
import { getFriendsList, sendFriendRequest } from "../../../api/services/friendService";

const ProfileScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

  const viewingUserId = route?.params?.userId || user?._id;
  const isCurrentUser = viewingUserId === user?._id;

  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [viewedUser, setViewedUser] = useState(null);

  // Fetch friend status and user info
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the viewed user's info
        if (!isCurrentUser) {
          const userData = await getUserById(viewingUserId);
          setViewedUser(userData);
        } else {
          setViewedUser(user); // Use current user data if viewing own profile
        }

        // Check if the viewed user is a friend
        if (!isCurrentUser && user?._id) {
          const friends = await getFriendsList(user._id);
          const isAlreadyFriend = friends.some(
            (friend) => friend.friendInfo?._id === viewingUserId
          );
          setIsFriend(isAlreadyFriend);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(t("setting.fetchError"));
      }
    };

    fetchData();
  }, [user, viewingUserId, isCurrentUser, t]);

  const handleShowQR = async () => {
    if (!user?._id) {
      setError(t("setting.qrErrorNoUserId"));
      return;
    }

    try {
      const qrUrl = await getUserQRById(user._id);
      setQrImageUrl(qrUrl);
      setIsQRModalVisible(true);
      setError(null);
    } catch (err) {
      setError(t("setting.qrErrorFetch"));
      console.error("Error fetching QR code:", err);
    }
  };

  const handleAddFriend = async () => {
    try {
      await sendFriendRequest(user._id, viewingUserId);
      setFriendRequestSent(true);
      alert(t("setting.friendRequestSent"));
    } catch (err) {
      console.error("Error sending friend request:", err);
      setError(t("setting.friendRequestError"));
    }
  };

  return (
    <CommonWhiteContainer style={styles.container}>
      <AvatarImage source={{ uri: viewedUser?.avatar }} />
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{t("setting.profileInfo")}</Text>
        <ProfileInfo label={t("setting.fullName")} value={viewedUser?.fullName} />
        <ProfileInfo label={t("setting.gender")} value={t(`setting.${viewedUser?.gender}`)} />
        <ProfileInfo label={t("setting.birthDate")} value={viewedUser?.birthDate} />
        <ProfileInfo label={t("setting.phoneNumber")} value={viewedUser?.phoneNumber} />

        {isCurrentUser ? (
          <>
            <PrimaryButton
              title={t("setting.showQR")}
              onPress={handleShowQR}
              style={styles.qrButton}
            />
          </>
        ) : (
          <>
            {isFriend ? (
              <Text style={styles.friendText}>{t("contact.alreadyFriends")}</Text>
            ) : (
              <PrimaryButton
                title={friendRequestSent ? t("contact.requestSent") : t("contact.addFriend")}
                onPress={handleAddFriend}
                disabled={friendRequestSent}
                style={styles.qrButton}
              />
            )}
          </>
        )}
      </View>

      <Modal
        visible={isQRModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsQRModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsQRModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : qrImageUrl ? (
              <Image
                source={{ uri: qrImageUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.loadingText}>{t("setting.qrLoading")}</Text>
            )}
          </View>
        </View>
      </Modal>
    </CommonWhiteContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoContainer: {
    backgroundColor: "#fff",
    paddingBottom: 20,
    width: "100%",
    paddingHorizontal: 16,
  },
  title: {
    fontWeight: "bold",
    marginVertical: 10,
    fontSize: 18,
  },
  qrButton: {
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  qrModal: {
    width: "80%",
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  qrImage: {
    width: 200,
    height: 200,
    marginVertical: 20,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#E74C3C",
    textAlign: "center",
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    marginVertical: 20,
  },
  friendText: {
    fontSize: 16,
    color: "#2ECC71",
    textAlign: "center",
    marginVertical: 10,
    marginTop: 50,
  },
});

export default ProfileScreen;