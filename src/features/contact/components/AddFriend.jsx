import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import SearchBar from "../../../components/common/SearchBar";
import axios from "axios";
import { API_BASE_URL } from "../../../config/index";
import { getUserByPhoneNumber } from "../../../api/services/userService";
import { getFriendsList, sendFriendRequest } from "../../../api/services/friendService";
import PrimaryButton from "../../../components/common/PrimaryButton";
const AddFriendScreen = ({ visible, onClose, userId }) => {
  const [searchText, setSearchText] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [error, setError] = useState(""); // Dùng để lưu lỗi khi tìm kiếm
  const [friendIds, setFriendIds] = useState([]);

  // Kiểm tra tính hợp lệ của số điện thoại
  const isValidPhoneNumber = (phone) => {
    const regex = /^[0-9]{10,15}$/; // Kiểm tra số điện thoại chỉ chứa số và có độ dài từ 10 đến 15
    return regex.test(phone);
  };
  useEffect(() => {
    if (visible && userId) {
      const fetchFriends = async () => {
        try {
          const friends = await getFriendsList(userId);
          const ids = friends.map((f) => f._id);
          setFriendIds(ids);
        } catch (error) {
        }
      };
      fetchFriends();
    }
  }, [visible, userId]);

  // Handle search khi người dùng thay đổi văn bản tìm kiếm
  const handleSearch = async (searchQuery) => {
    // Không báo lỗi nếu không nhập gì hoặc đang nhập
    if (!searchQuery.trim()) {
      setError(""); // Không báo lỗi
      setFoundUser(null);
      return;
    }

    // Báo lỗi nếu số điện thoại không hợp lệ
    if (!isValidPhoneNumber(searchQuery)) {
      setError("Số điện thoại không hợp lệ.");
      setFoundUser(null);
      return;
    }

    try {
      const user = await getUserByPhoneNumber(searchQuery);
      if (user && user._id === userId) {
        Alert.alert("⚠️", "Không thể tìm chính bạn");
        setFoundUser(null);
      } else if (user) {
        console.log("Tìm thấy người dùng:", user);
        setFoundUser(user);
        setError(""); // Xóa lỗi khi tìm thấy người dùng
      }
    } catch (error) {
      console.log("Không tìm thấy:", error);
      setError("Không tìm thấy người dùng.");
      setFoundUser(null);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch(searchText);
    }, 500); // Delay 500ms sau khi người dùng ngừng gõ

    return () => clearTimeout(delayDebounce); // Clear timeout nếu người dùng tiếp tục gõ
  }, [searchText]);

  // Handle gửi lời mời kết bạn
  const handleAddFriend = async () => {
    if (!foundUser) return;

    try {
      await sendFriendRequest(userId, foundUser._id);
      Alert.alert("✅", "Đã gửi lời mời kết bạn");
      setSearchText("");
      setFoundUser(null);
    } catch (error) {
      let errorMessage = "Gửi lời mời thất bại";
      if (error.response) {
        errorMessage = error.response.data.message || "Lỗi từ server";
      } else if (error.request) {
        errorMessage = "Không thể kết nối đến server";
      }
      Alert.alert("❌", errorMessage);
    }
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
          <SearchBar search={searchText} setSearch={setSearchText} />
          {/* Hiển thị lỗi nếu có */}
          {error && <Text style={styles.errorText}>{error}</Text>}
          <View style={styles.resultsContainer}>
            {foundUser ? (
              <View style={styles.friendItem}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {foundUser.avatar ? (
                    <Image
                      source={{ uri: foundUser.avatar }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarPlaceholder,
                        { backgroundColor: "#ddd" },
                      ]}
                    >
                      <Text style={{ fontSize: 12, color: "#555" }}>
                        {item.fullName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.name}>{foundUser.fullName}</Text>
                    <Text style={styles.phone}>{foundUser.phoneNumber}</Text>
                  </View>
                </View>
                {friendIds.includes(foundUser._id) ? (
                  <View
                    style={[styles.addButton, { backgroundColor: "#6c757d" }]}
                  >
                    <Text style={{ color: "#fff" }}>Đã là bạn</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddFriend}
                  >
                    <Text style={{ color: "#fff", lineHeight: 30 }}>Thêm bạn</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text style={styles.resultsText}>
                Nhập số điện thoại để tìm bạn
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.clearButton} onPress={() => {
            setSearchText("");
            setFoundUser(null);
            setError("");
            }}>
            <Text style={styles.clearButtonText}>Xoá tìm kiếm</Text>
          </TouchableOpacity>
          <PrimaryButton onPress={onClose} title={"Đóng"} />
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
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  modalContainer: {
    width: "90%",
    height: "50%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    justifyContent: "space-between",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  resultsContainer: {
    flex: 1,
    marginTop: 16,
  },
  resultsText: {
    fontSize: 16,
    textAlign: "center",
    color: "#999",
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  name: {
    fontWeight: "600",
    fontSize: 16,
  },
  phone: {
    color: "#666",
  },
  addButton: {
    backgroundColor: "#28a745",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  clearButton: {
    backgroundColor: "gray",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 10,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#ccc",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    fontWeight: "bold",
    color: "#000",
  },
});

export default AddFriendScreen;
