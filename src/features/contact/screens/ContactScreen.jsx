import React, { useState, useEffect, useContext, useCallback } from "react";
import { View, StyleSheet, Pressable, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as Contacts from "expo-contacts";
import { useFocusEffect } from "@react-navigation/native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";

import { AuthContext } from "../../../context/AuthContext";
import {
  getFriendsList,
  sendFriendRequest,
  getPendingFriendRequests,
} from "../../../api/services/friendService";
import { getUserByPhoneNumber, getUserById } from "../../../api/services/userService";

import CommonWhiteContainer from "../../../components/layout/CommonWhiteContainer";
import SearchBar from "../../../components/common/SearchBar";
import FriendList from "../components/FriendList";
import AddFriendScreen from "../components/AddFriend";
import FriendRequestScreen from "../components/FriendRequest";
import PrimaryButton from "../../../components/common/PrimaryButton";
import socket from "../../../utils/socket";
import { useColor } from "../../../context/ColorContext";

const ContactScreen = ({ navigation }) => {
  const { COLORS } = useColor();
  const [search, setSearch] = useState("");
  const [friends, setFriends] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showFriendRequest, setShowFriendRequest] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [requestCount, setRequestCount] = useState(0);

  const fetchFriends = async () => {
    try {
      if (user?._id) {
        console.log(`Fetching friends for userId: ${user._id}`);
        const data = await getFriendsList(user._id);
        setFriends(data);
        setFilteredData(data);
      }
    } catch (error) {
      console.log("Lỗi lấy danh sách bạn bè:", error);
    }
  };

  const fetchRequestCount = async () => {
    try {
      const data = await getPendingFriendRequests(user._id);
      setRequestCount(data.length);
    } catch (error) {
      console.log("Lỗi lấy số lượng lời mời:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFriends();
      fetchRequestCount();
    }, [user])
  );

  useEffect(() => {
    if (!user?._id) return;

    socket.on("friend-online", fetchFriends);
    socket.on("friendAccepted", fetchFriends);
    socket.on("friendRemoved", fetchFriends);
    socket.on("receiveFriendRequest", fetchRequestCount);

    return () => {
      socket.off("friend-online");
      socket.off("friendAccepted");
      socket.off("friendRemoved");
      socket.off("receiveFriendRequest");
    };
  }, [user]);

  useEffect(() => {
    const fetchAndFilter = async () => {
      try {
        const lowerSearch = search.toLowerCase();
        const enrichedFriends = friends.map((item) => ({
          ...item,
          _friendName: item.friendInfo?.fullName?.toLowerCase() || "",
          _phone: item.friendInfo?.phoneNumber?.toLowerCase() || "",
        }));

        const filtered = enrichedFriends.filter(
          (item) =>
            item._friendName.includes(lowerSearch) ||
            item._phone.includes(lowerSearch)
        );

        setFilteredData(filtered);
      } catch (err) {}
    };

    if (search && friends.length > 0) {
      fetchAndFilter();
    } else {
      setFilteredData(friends);
    }
  }, [search, friends]);

  const readContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });

        if (data.length > 0) {
          const filtered = data
            .filter((contact) => contact.phoneNumbers?.length)
            .map((contact) => ({
              name: contact.name,
              phone: contact.phoneNumbers[0].number.replace(/\s+/g, ""),
            }));

          for (const contact of filtered) {
            try {
              const targetUser = await getUserByPhoneNumber(contact.phone);
              if (targetUser?._id && targetUser._id !== user._id) {
                await sendFriendRequest(user._id, targetUser._id);
                console.log(
                  `Đã gửi lời mời kết bạn tới: ${contact.name} - ${contact.phone}`
                );
              }
            } catch (err) {
              // Không tìm thấy user theo số này, bỏ qua
            }
          }

          alert(
            "🎉 Đã quét danh bạ và gửi lời mời kết bạn (nếu có người dùng)."
          );
        }
      } else {
        alert("⛔️ Không được cấp quyền truy cập danh bạ.");
      }
    } catch (error) {
      console.error("Lỗi khi đọc danh bạ và gửi lời mời:", error);
      alert("⚠️ Có lỗi xảy ra khi xử lý danh bạ.");
    }
  };

  const handleQRScan = async (data) => {
    try {
      console.log("data: ",data)
      // Assuming the QR code contains a userId
      const scannedUserId = JSON.parse(data).userId;
      console.log(scannedUserId,user._id)

      if (scannedUserId && scannedUserId !== user._id) {
        const targetUser = await getUserById(scannedUserId);
        if (targetUser) {
          setShowQRScanner(false);
          navigation.navigate("Profile", { userId: scannedUserId });
        } else {
          alert("⚠️ Không tìm thấy người dùng với mã QR này.");
        }
      } else {
        alert("⚠️ Mã QR không hợp lệ hoặc thuộc về bạn.");
      }
    } catch (error) {
      console.error("Lỗi khi quét mã QR:", error);
      alert("⚠️ Có lỗi xảy ra khi quét mã QR.");
    }
  };

  const openQRScanner = async () => {
    if (!permission) {
      // Camera permissions are still loading
      return;
    }

    if (!permission.granted) {
      const { status } = await requestPermission();
      if (status !== "granted") {
        alert("⛔️ Không được cấp quyền truy cập máy ảnh.");
        return;
      }
    }

    setShowPopup(false);
    setShowQRScanner(true);
  };

  return (
    <CommonWhiteContainer>
      <View style={styles.searchContainer}>
        <SearchBar search={search} setSearch={setSearch} />
        <View style={styles.createGroupButton}>
          <Ionicons
            name="add-circle"
            size={44}
            color={COLORS.primary}
            onPress={() => setShowPopup(true)}
          />
        </View>
      </View>

      <FriendList
        data={filteredData}
        navigation={navigation}
        onUnfriend={fetchFriends}
      />

      {/* Popup hành động khi bấm nút + */}
      {showPopup && (
        <Pressable
          style={styles.overlay}
          activeOpacity={1}
          onPressOut={() => {
            console.log("Overlay pressed to close popup");
            setShowPopup(false);
          }}
        >
          <View style={styles.popupMenu}>
            <PrimaryButton
              title="Thêm bạn bè"
              onPress={() => {
                console.log("Thêm bạn bè button pressed");
                setShowPopup(false);
                setShowAddFriend(true);
              }}
            />
            <View style={{ height: 10 }} />
            <PrimaryButton
              title="Yêu cầu kết bạn"
              onPress={() => {
                console.log("Yêu cầu kết bạn button pressed");
                setShowPopup(false);
                setShowFriendRequest(true);
              }}
            />
            <View style={{ height: 10 }} />
            <PrimaryButton
              title="Quét danh bạ"
              onPress={() => {
                console.log("Quét danh bạ button pressed");
                setShowPopup(false);
                readContacts();
              }}
            />
            <View style={{ height: 10 }} />
            <PrimaryButton
              title="Quét mã QR kết bạn"
              onPress={() => {
                console.log("Quét mã QR button pressed");
                openQRScanner();
              }}
            />
          </View>
        </Pressable>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={({ data }) => handleQRScan(data)}
        >
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setShowQRScanner(false)}
            >
              <Text style={styles.text}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}

      <AddFriendScreen
        visible={showAddFriend}
        onClose={() => setShowAddFriend(false)}
        userId={user?._id}
      />

      <FriendRequestScreen
        visible={showFriendRequest}
        onClose={() => setShowFriendRequest(false)}
        userId={user?._id}
        onRequestCountChange={(count) => setRequestCount(count)}
      />
    </CommonWhiteContainer>
  );
};

export default ContactScreen;

const styles = StyleSheet.create({
  popupMenu: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 20,
    zIndex: 20,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  createGroupButton: {
    position: "absolute",
    right: 2,
    top: "50%",
    transform: [{ translateY: -22 }],
    backgroundColor: "white",
    borderRadius: 22,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
  searchContainer: {
    position: "relative",
    width: "100%",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
    marginBottom: 50,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
});