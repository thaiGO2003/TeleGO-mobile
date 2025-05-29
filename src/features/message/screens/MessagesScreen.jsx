import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useColor } from "../../../context/ColorContext";
import { useTranslation } from "react-i18next";
import MessageList from "../components/MessageList";
import { getLastMessages } from "../../../api/services/messageService";
import { getUserById } from "../../../api/services/userService";
import socket from "../../../utils/socket";
import CommonPrimaryContainer from "../../../components/layout/CommonWhiteContainer";
import { getFriendsList } from "../../../api/services/friendService";
import { createGroup, getGroupById, joinGroup } from "../../../api/services/groupService";

// Component SearchBar: Thanh tìm kiếm tin nhắn
const SearchBar = ({ search, setSearch }) => {
  const { t } = useTranslation();
  const { COLORS } = useColor();

  return (
    <View
      style={{
        marginHorizontal: 22,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primary,
        height: 48,
        marginVertical: 22,
        paddingHorizontal: 12,
        borderRadius: 25,
        width: "100%",
      }}
    >
      <Ionicons name="search-outline" size={24} color={COLORS.white} />
      <TextInput
        style={{
          flex: 1,
          height: "100%",
          marginHorizontal: 12,
          color: COLORS.white,
        }}
        onChangeText={setSearch}
        value={search}
        placeholder={t("message.searchPlaceholder")}
        placeholderTextColor={COLORS.white}
      />
    </View>
  );
};

const MessagesScreen = () => {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [lastScanTime, setLastScanTime] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { COLORS } = useColor();
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [optionModalVisible, setOptionModalVisible] = useState(false);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [friendSearch, setFriendSearch] = useState("");
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!user?._id) {
      console.log("Error: user._id is undefined");
      return;
    }
    try {
      setIsLoading(true);
      const messages = await getLastMessages(user._id);
      const enrichedMessages = await Promise.all(
        messages.map(async (item) => {
          if (item.groupId) {
            try {
              const groupData = await getGroupById(item.groupId);
              return {
                ...item,
                groupName: groupData.groupName || "Unnamed Group",
                groupMembers: groupData.groupMembers || [],
                avatar: groupData.avatar || null,
              };
            } catch (error) {
              console.error(`Error fetching group ${item.groupId}:`, error);
              return {
                ...item,
                groupName: "Unknown Group",
                groupMembers: [],
                avatar: null,
              };
            }
          }
          return item;
        })
      );
      setMessages(enrichedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      Alert.alert("Lỗi", "Không thể tải tin nhắn");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const openQRScanner = async () => {
    if (!permission) return;
    if (!permission.granted) {
      const { status } = await requestPermission();
      if (status !== "granted") {
        Alert.alert("Lỗi", "Không được cấp quyền truy cập máy ảnh.");
        return;
      }
    }
    setOptionModalVisible(false);
    setShowQRScanner(true);
  };

  const handleQRScan = async ({ data: qrData }) => {
    if (isScanning) return;
    const currentTime = Date.now();
    if (currentTime - lastScanTime < 3000) return;
    setIsScanning(true);
    try {
      let scannedData;
      try {
        scannedData = JSON.parse(qrData);
      } catch (parseError) {
        throw new Error("Mã QR không hợp lệ");
      }
      const { groupId } = scannedData;
      if (!groupId || !user?._id) {
        throw new Error("Mã QR không hợp lệ hoặc không tìm thấy ID người dùng");
      }
      const groupData = await getGroupById(groupId);
      if (groupData.groupMembers.includes(user._id)) {
        setShowQRScanner(false);
        setLastScanTime(currentTime);
        Alert.alert(
          "Thông báo",
          `Bạn đã là thành viên của nhóm: ${groupData.groupName || "Group"}`
        );
        fetchMessages();
        return;
      }
      try {
        await joinGroup(groupId, user._id);
      } catch (joinError) {
        if (joinError.response?.status === 409) {
          setShowQRScanner(false);
          setLastScanTime(currentTime);
          Alert.alert(
            "Thông báo",
            `Bạn đã là thành viên của nhóm: ${groupData.groupName || "Group"}`
          );
          fetchMessages();
          return;
        }
        throw joinError;
      }
      setShowQRScanner(false);
      setLastScanTime(currentTime);
      Alert.alert(
        "Thành công",
        `Đã tham gia nhóm: ${groupData.groupName || "Group"}`
      );
      fetchMessages();
    } catch (error) {
      setShowQRScanner(false);
      console.error("Error scanning QR code:", error);
      Alert.alert("Lỗi", error.message || "Không thể tham gia nhóm");
    } finally {
      setIsScanning(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMessages();
      return () => setFilteredData([]);
    }, [fetchMessages])
  );

  useEffect(() => {
    const combinedData = messages.map((item) => ({
      _id: item._id,
      isGroup: !!item.groupId,
      groupId: item.groupId || null,
      groupName: item.groupName || null,
      groupMembers: item.groupMembers || [],
      avatar: item.avatar || null,
      users: item.users || [],
      fromSelf: item.fromSelf,
      message: item.message || "",
      fileUrls: item.fileUrls || [],
      fileTypes: item.fileTypes || [],
      emoji: item.emoji || [],
      createdAt: item.createdAt,
      recalled: item.recalled || false,
    }));

    if (search) {
      const lowerSearch = search.toLowerCase();
      const enrichedData = combinedData.map((item) => {
        if (item.isGroup) {
          return {
            ...item,
            _searchableName: item.groupName?.toLowerCase() || "",
          };
        }
        const otherUserId = item.users?.find((id) => id !== user._id);
        let name = "";
        if (otherUserId) {
          name = getUserById(otherUserId)
            .then((userData) => userData.fullName || "")
            .catch(() => "");
        }
        return {
          ...item,
          _otherUserNamePromise: Promise.resolve(name),
          _messageText: item.message?.toLowerCase() || "",
          _otherUserId: otherUserId?.toLowerCase() || "",
        };
      });

      Promise.all(
        enrichedData.map(async (item) => ({
          ...item,
          _otherUserName: item._otherUserNamePromise
            ? await item._otherUserNamePromise
            : "",
        }))
      ).then((resolvedData) => {
        const filtered = resolvedData.filter(
          (item) =>
            (item.isGroup && item._searchableName.includes(lowerSearch)) ||
            (!item.isGroup &&
              (item._messageText?.includes(lowerSearch) ||
                item._otherUserId?.includes(lowerSearch) ||
                item._otherUserName.toLowerCase().includes(lowerSearch)))
        );
        setFilteredData(filtered);
      });
    } else {
      setFilteredData(combinedData);
    }
  }, [search, messages, user]);

  useEffect(() => {
    if (!user?._id) return;
    const handleMessageReceive = () => {
      fetchMessages();
    };
    socket.on("msg-receive", handleMessageReceive);
    socket.on("group-msg-receive", handleMessageReceive);
    return () => {
      socket.off("msg-receive", handleMessageReceive);
      socket.off("group-msg-receive", handleMessageReceive);
    };
  }, [user, fetchMessages]);

  const handleAddButtonPress = () => {
    setOptionModalVisible(true);
  };

  const handleCreateGroupOption = () => {
    setOptionModalVisible(false);
    fetchFriends();
    setCreateGroupModalVisible(true);
  };

  const fetchFriends = async () => {
    if (!user?._id) {
      console.log("Lỗi: user._id không tồn tại");
      Alert.alert("Lỗi", "Không tìm thấy ID người dùng");
      return;
    }
    try {
      setIsLoading(true);
      const friendsListResponse = await getFriendsList(user._id);
      console.log("Dữ liệu từ API:", friendsListResponse);
      const friendsList = Array.isArray(friendsListResponse)
        ? friendsListResponse
            .map((item) => item?.friendInfo)
            .filter((friend) => friend && friend._id && friend.fullName)
        : [];
      console.log("Danh sách bạn bè sau xử lý:", friendsList);
      setFriends(friendsList);
      setFilteredFriends(friendsList);
      if (friendsList.length === 0) {
        console.log("Không có bạn bè nào");
        Alert.alert("Thông báo", "Không có bạn bè nào để hiển thị");
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách bạn bè:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách bạn bè");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const lowerSearch = friendSearch.toLowerCase();
    const filtered = friends.filter(
      (friend) =>
        friend?.fullName?.toLowerCase().includes(lowerSearch) ?? false
    );
    setFilteredFriends(filtered);
  }, [friendSearch, friends]);

  const toggleFriendSelection = (friend) => {
    if (!friend || !friend._id) return;
    setSelectedFriends((prev) => {
      if (prev.some((f) => f._id === friend._id)) {
        return prev.filter((f) => f._id !== f._id);
      } else {
        return [...prev, friend];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tên nhóm");
      return;
    }
    if (selectedFriends.length < 2) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất 2 bạn bè");
      return;
    }
    try {
      setIsLoading(true);
      const groupMembers = [
        ...selectedFriends.map((friend) => friend._id),
        user._id,
      ];
      const groupAdmin = user._id;
      const newGroup = await createGroup(
        groupName.trim(),
        groupMembers,
        groupAdmin
      );
      navigation.navigate("Chat", {
        groupId: newGroup._id,
        groupName: newGroup.groupName,
        groupMembers: newGroup.groupMembers,
      });
      setGroupName("");
      setFriendSearch("");
      setSelectedFriends([]);
      setCreateGroupModalVisible(false);
      Alert.alert("Thành công", "Đã tạo nhóm chat");
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Lỗi", "Không thể tạo nhóm");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndCloseGroupModal = () => {
    setGroupName("");
    setFriendSearch("");
    setSelectedFriends([]);
    setCreateGroupModalVisible(false);
  };

  const renderFriendItem = ({ item }) => {
    if (!item || !item._id || !item.fullName) {
      console.log("Dữ liệu bạn bè không hợp lệ:", item);
      return null;
    }
    console.log("Đang hiển thị bạn:", item.fullName);
    const isSelected = selectedFriends.some((friend) => friend._id === item._id);
    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.selectedFriendItem]}
        onPress={() => toggleFriendSelection(item)}
      >
        <View style={styles.friendInfo}>
          <Ionicons
            name="person-circle-outline"
            size={40}
            color={isSelected ? COLORS.primary : "#666"}
          />
          <Text style={styles.friendName}>{item.fullName}</Text>
        </View>
        <Ionicons
          name={isSelected ? "checkmark-circle" : "ellipse-outline"}
          size={24}
          color={isSelected ? COLORS.primary : "#666"}
        />
      </TouchableOpacity>
    );
  };

  return (
    <CommonPrimaryContainer>
      {showQRScanner && (
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleQRScan}
        >
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setShowQRScanner(false)}
            >
              <Text style={styles.qrButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
      <View style={styles.searchContainer}>
        <SearchBar search={search} setSearch={setSearch} />
        <View style={styles.createGroupButton}>
          <Ionicons
            name="add-circle"
            size={44}
            color={COLORS.primary}
            onPress={handleAddButtonPress}
          />
        </View>
      </View>
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.loader}
        />
      ) : (
        <MessageList data={filteredData} />
      )}
      <Modal
        animationType="fade"
        transparent={true}
        visible={optionModalVisible}
        onRequestClose={() => setOptionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleCreateGroupOption}
            >
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <Text style={styles.modalOptionText}>Tạo nhóm</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.modalOption} onPress={openQRScanner}>
              <Ionicons name="qr-code" size={24} color={COLORS.primary} />
              <Text style={styles.modalOptionText}>Tham gia nhóm bằng QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={createGroupModalVisible}
        onRequestClose={resetAndCloseGroupModal}
      >
        <View style={styles.createGroupModal}>
          <View style={styles.createGroupContent}>
            <Text style={styles.modalTitle}>Tạo Nhóm Chat</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="people"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.groupNameInput}
                placeholder="Tên nhóm (VD: Team Vui Vẻ)"
                placeholderTextColor="#999"
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>
            <View style={styles.selectedInfoContainer}>
              <Text style={styles.selectedCount}>
                Đã chọn: {selectedFriends.length} bạn
              </Text>
              {selectedFriends.length < 2 && (
                <Text style={styles.warningText}>Chọn ít nhất 2 bạn bè</Text>
              )}
              {!groupName.trim() && (
                <Text style={styles.warningText}>Nhập tên nhóm</Text>
              )}
            </View>
            <View style={styles.friendSearchContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.friendSearchInput}
                placeholder="Tìm bạn bè..."
                placeholderTextColor="#999"
                value={friendSearch}
                onChangeText={setFriendSearch}
              />
            </View>
            {isLoading ? (
              <ActivityIndicator
                size="large"
                color={COLORS.primary}
                style={styles.loader}
              />
            ) : (
              <FlatList
                data={filteredFriends}
                renderItem={renderFriendItem}
                keyExtractor={(item) => item._id}
                style={styles.friendsList}
                ListEmptyComponent={
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#666",
                      marginTop: 20,
                    }}
                  >
                    Không tìm thấy bạn bè nào
                  </Text>
                }
              />
            )}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={resetAndCloseGroupModal}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.createButton,
                  !(selectedFriends.length >= 2 && groupName.trim()) &&
                    styles.disabledButton,
                ]}
                onPress={handleCreateGroup}
                disabled={
                  !(selectedFriends.length >= 2 && groupName.trim()) || isLoading
                }
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Tạo Nhóm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CommonPrimaryContainer>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    position: "relative",
    width: "100%",
    alignItems: "center",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 10,
  },
  createGroupModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  createGroupContent: {
    width: "95%",
    height: "60%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 16,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f9fc",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e0e6ed",
  },
  inputIcon: {
    marginRight: 8,
  },
  groupNameInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 14,
  },
  selectedInfoContainer: {
    marginBottom: 12,
  },
  selectedCount: {
    fontSize: 15,
    color: "#7f8c8d",
    marginBottom: 6,
  },
  warningText: {
    fontSize: 13,
    color: "#e74c3c",
    marginBottom: 6,
  },
  friendSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f9fc",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e6ed",
  },
  friendSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  friendsList: {
    flex: 1,
    marginBottom: 12,
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedFriendItem: {
    backgroundColor: "rgba(52, 152, 219, 0.1)",
  },
  friendInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendName: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  cancelButton: {
    backgroundColor: "#e74c3c",
  },
  createButton: {
    backgroundColor: "#3498db",
  },
  disabledButton: {
    backgroundColor: "#bdc3c7",
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
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
  },
  qrButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
});

export default MessagesScreen;