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
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { addGroupMembers, joinGroup } from "../../../api/services/groupService";
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
import { createGroup, getGroupById } from "../../../api/services/groupService";

// Component SearchBar: Thanh tìm kiếm tin nhắn
const SearchBar = ({ search, setSearch, handleSearch }) => {
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
      <Ionicons
        name="search-outline"
        size={24}
        color={COLORS.white}
        onPress={handleSearch}
      />
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
  const [showQRScanner, setShowQRScanner] = useState(false); // Trạng thái hiển thị QR Scanner
  const [permission, requestPermission] = useCameraPermissions(); // Quyền camera
  const [lastScanTime, setLastScanTime] = useState(0);
  const [isScanning, setIsScanning] = useState(false); // Track if a scan is in progress
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { COLORS } = useColor();
  const { user } = useContext(AuthContext);

  // State
  const [messages, setMessages] = useState([]); // Danh sách tin nhắn (cá nhân và nhóm)
  const [search, setSearch] = useState(""); // Giá trị tìm kiếm tin nhắn
  const [filteredData, setFilteredData] = useState([]); // Tin nhắn sau lọc
  const [optionModalVisible, setOptionModalVisible] = useState(false); // Modal tùy chọn
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false); // Modal tạo nhóm
  const [groupName, setGroupName] = useState(""); // Tên nhóm
  const [friendSearch, setFriendSearch] = useState(""); // Tìm kiếm bạn bè
  const [friends, setFriends] = useState([]); // Danh sách bạn bè
  const [filteredFriends, setFilteredFriends] = useState([]); // Bạn bè sau lọc
  const [selectedFriends, setSelectedFriends] = useState([]); // Bạn bè được chọn
  const [isLoading, setIsLoading] = useState(false); // Trạng thái tải

  // Hàm lấy tin nhắn cuối cùng (cả cá nhân và nhóm)
  const fetchMessages = useCallback(async () => {
    if (!user?._id) return;
    try {
      setIsLoading(true);
      const messages = await getLastMessages(user._id);

      // Enrich group messages with group details
      const enrichedMessages = await Promise.all(
        messages.map(async (item) => {
          if (item.groupId) {
            try {
              const groupData = await getGroupById(item.groupId);
              return {
                ...item,
                groupName: groupData.groupName || "Unnamed Group",
                groupMembersdf: groupData.groupMembers || [],
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
      Alert.alert("Error", "Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  const openQRScanner = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const { status } = await requestPermission();
      if (status !== "granted") {
        Alert.alert("Error", "Không được cấp quyền truy cập máy ảnh.");
        return;
      }
    }

    setOptionModalVisible(false);
    setShowQRScanner(true);
  };
  const handleQRScan = async ({ data: qrData }) => {
    if (isScanning) {
      return;
    }

    const currentTime = Date.now();
    if (currentTime - lastScanTime < 3000) {
      return;
    }
    setIsScanning(true); // Mark scan as in progress

    try {
      const scannedData = JSON.parse(qrData);
      const { groupId } = scannedData;

      if (groupId && user?._id) {
        // Check if user is already in the group
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

        // Join the group
        await joinGroup(groupId, user._id);

        setShowQRScanner(false);
        setLastScanTime(currentTime);

        Alert.alert(
          "Thành công",
          `Đã tham gia nhóm: ${groupData.groupName || "Group"}`
        );
        fetchMessages();
      } else {
        setShowQRScanner(false);
        Alert.alert("Lỗi", "Mã QR không hợp lệ");
      }
    } catch (error) {
      setShowQRScanner(false);
      console.error("Error scanning QR code:", error);
      if (error.response?.status === 409) {
        try {
          const groupData = await getGroupById(groupId);
          setLastScanTime(currentTime);
          Alert.alert(
            "Thông báo",
            `Bạn đã là thành viên của nhóm: ${groupData.groupName || "Group"}`
          );
          fetchMessages();
        } catch (fetchError) {
          Alert.alert("Lỗi", "Không thể lấy thông tin nhóm");
        }
      } else {
        Alert.alert("Lỗi", error.message || "Không thể tham gia nhóm");
      }
    } finally {
      setIsScanning(false); // Reset scan status
    }
  };
  // Gọi fetchMessages khi màn hình focus
  useFocusEffect(
    useCallback(() => {
      fetchMessages();
      return () => setFilteredData([]);
    }, [fetchMessages])
  );

  // Kết hợp và lọc tin nhắn dựa trên tìm kiếm
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
              (item._messageText.includes(lowerSearch) ||
                item._otherUserId.includes(lowerSearch) ||
                item._otherUserName.toLowerCase().includes(lowerSearch)))
        );
        setFilteredData(filtered);
      });
    } else {
      setFilteredData(combinedData);
    }
  }, [search, messages, user]);

  // Lắng nghe tin nhắn mới qua socket
  useEffect(() => {
    if (!user?._id) return;

    const handleMessageReceive = () => {
      fetchMessages();
    };

    socket.on("msg-receive", handleMessageReceive);
    socket.on("group-msg-receive", handleMessageReceive);
    socket.on("groupMemberAdded", handleMessageReceive);
    socket.on("groupMemberRemoved", handleMessageReceive);
    socket.on("groupUpdated", handleMessageReceive);
    socket.on("groupRenamed", handleMessageReceive);
    socket.on("avatarUpdated", handleMessageReceive);
    socket.on("groupDeleted", handleMessageReceive);

    return () => {
      socket.off("msg-receive", handleMessageReceive);
      socket.off("group-msg-receive", handleMessageReceive);
      socket.off("groupMemberAdded", handleMessageReceive);
      socket.off("groupMemberRemoved", handleMessageReceive);
      socket.off("groupUpdated", handleMessageReceive);
      socket.off("groupRenamed", handleMessageReceive);
      socket.off("avatarUpdated", handleMessageReceive);
      socket.off("groupDeleted", handleMessageReceive);
    };
  }, [user, fetchMessages]);

  // Xử lý nhấn nút thêm
  const handleAddButtonPress = () => {
    setOptionModalVisible(true);
  };

  // Mở modal tạo nhóm
  const handleCreateGroupOption = () => {
    setOptionModalVisible(false);
    fetchFriends();
    setCreateGroupModalVisible(true);
  };

  // Xử lý thêm bạn bè (chưa triển khai)
  const handleAddFriendOption = () => {
    setOptionModalVisible(false);
    console.log("Navigate to add friend screen");
  };

  // Lấy danh sách bạn bè từ API
  const fetchFriends = async () => {
    if (!user?._id) return;

    try {
      setIsLoading(true);
      const friendsListResponse = await getFriendsList(user._id);
      const friendsList = friendsListResponse
        .map((item) => item.friendInfo)
        .filter((friend) => friend && friend._id && friend.fullName);
      setFriends(friendsList);
      setFilteredFriends(friendsList);
    } catch (error) {
      console.error("Error fetching friends:", error);
      Alert.alert("Error", "Failed to load friends list");
    } finally {
      setIsLoading(false);
    }
  };

  // Lọc bạn bè dựa trên tìm kiếm
  useEffect(() => {
    if (friendSearch) {
      const lowerSearch = friendSearch.toLowerCase();
      const filtered = friends.filter((friend) =>
        friend.fullName.toLowerCase().includes(lowerSearch)
      );
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends(friends);
    }
  }, [friendSearch, friends]);

  // Chọn hoặc bỏ chọn bạn bè
  const toggleFriendSelection = (friend) => {
    if (!friend || !friend._id) {
      console.log("Invalid friend:", friend);
      return;
    }

    setSelectedFriends((prev) => {
      if (prev.some((f) => f._id === friend._id)) {
        return prev.filter((f) => f._id !== friend._id);
      } else {
        return [...prev, friend];
      }
    });
  };

  // Xử lý tạo nhóm
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

      // Gọi API tạo nhóm
      const newGroup = await createGroup(
        groupName.trim(),
        groupMembers,
        groupAdmin
      );

      // Điều hướng đến ChatScreen với thông tin nhóm
      navigation.navigate("Chat", {
        groupId: newGroup._id,
        groupName: newGroup.groupName,
        groupMembers: newGroup.groupMembers,
      });

      // Reset state
      setGroupName("");
      setFriendSearch("");
      setSelectedFriends([]);
      setCreateGroupModalVisible(false);

      Alert.alert("Thành công", "Đã tạo nhóm chat");
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Lỗi", error.message || "Không thể tạo nhóm");
    } finally {
      setIsLoading(false);
    }
  };

  // Đóng modal và reset state
  const resetAndCloseGroupModal = () => {
    setGroupName("");
    setFriendSearch("");
    setSelectedFriends([]);
    setCreateGroupModalVisible(false);
  };

  // Render item bạn bè trong FlatList
  const renderFriendItem = ({ item }) => {
    if (!item || !item._id) {
      console.log("Invalid friend item:", item);
      return null;
    }

    const isSelected = selectedFriends.some(
      (friend) => friend._id === item._id
    );

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
      {/* Thanh tìm kiếm và nút thêm */}
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

      {/* Danh sách tin nhắn */}
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.loader}
        />
      ) : (
        <MessageList data={filteredData} />
      )}

      {/* Modal tùy chọn */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={optionModalVisible}
        onRequestClose={() => setOptionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOptionModalVisible(false)}
        >
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleCreateGroupOption}
            >
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <Text style={styles.modalOptionText}>Tạo nhóm</Text>
            </TouchableOpacity>

            <View style={styles.divider} />
            {/* Tạo nhóm 
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleAddFriendOption}
            >
              <Ionicons name="person-add" size={24} color={COLORS.primary} />
              <Text style={styles.modalOptionText}>Thêm bạn bè</Text>
            </TouchableOpacity>*/}
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={optionModalVisible}
        onRequestClose={() => setOptionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOptionModalVisible(false)}
        >
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleCreateGroupOption}
            >
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <Text style={styles.modalOptionText}>Tạo nhóm</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.modalOption}
              onPress={openQRScanner}
            >
              <Ionicons name="qr-code" size={24} color={COLORS.primary} />
              <Text style={styles.modalOptionText}>Tham gia nhóm bằng QR</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal tạo nhóm */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createGroupModalVisible}
        onRequestClose={resetAndCloseGroupModal}
      >
        <View style={styles.createGroupModal}>
          <View style={styles.createGroupContent}>
            <Text style={styles.modalTitle}>Tạo nhóm</Text>

            {/* Nhập tên nhóm */}
            <TextInput
              style={styles.groupNameInput}
              placeholder="Nhập tên nhóm"
              value={groupName}
              onChangeText={setGroupName}
            />

            {/* Số bạn bè được chọn và thông báo */}
            <View style={styles.selectedInfoContainer}>
              <Text style={styles.selectedCount}>
                Đã chọn: {selectedFriends.length} bạn
              </Text>
              {selectedFriends.length < 2 && (
                <Text style={styles.warningText}>
                  Cần chọn ít nhất 2 bạn bè
                </Text>
              )}
              {!groupName.trim() && (
                <Text style={styles.warningText}>Vui lòng đặt tên nhóm</Text>
              )}
            </View>

            {/* Tìm kiếm bạn bè */}
            <View style={styles.friendSearchContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.friendSearchInput}
                placeholder="Tìm kiếm bạn bè"
                value={friendSearch}
                onChangeText={setFriendSearch}
              />
            </View>

            {/* Danh sách bạn bè */}
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
                keyExtractor={(item, index) =>
                  item && item._id ? item._id : `fallback-${index}`
                }
                style={styles.friendsList}
                extraData={selectedFriends}
              />
            )}

            {/* Nút Hủy và Tạo nhóm */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={resetAndCloseGroupModal}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.createButton,
                  !(selectedFriends.length >= 2 && groupName.trim()) &&
                    styles.disabledButton,
                ]}
                onPress={handleCreateGroup}
                disabled={
                  !(selectedFriends.length >= 2 && groupName.trim()) ||
                  isLoading
                }
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Tạo nhóm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CommonPrimaryContainer>
  );
};

// Styles
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  createGroupContent: {
    width: "90%",
    height: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  groupNameInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  selectedInfoContainer: {
    marginBottom: 10,
  },
  selectedCount: {
    fontSize: 14,
    marginBottom: 5,
    color: "#666",
  },
  warningText: {
    fontSize: 12,
    color: "#FF6347",
    marginBottom: 5,
  },
  friendSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    padding: 8,
    marginBottom: 10,
  },
  friendSearchInput: {
    flex: 1,
    marginLeft: 8,
    padding: 4,
  },
  friendsList: {
    flex: 1,
    marginVertical: 10,
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  selectedFriendItem: {
    backgroundColor: "rgba(0, 123, 255, 0.1)",
  },
  friendInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendName: {
    marginLeft: 10,
    fontSize: 16,
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
  cancelButton: {
    backgroundColor: "#ff0000",
    marginRight: 10,
  },
  createButton: {
    backgroundColor: "#007BFF",
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
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
  buttonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  qrButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
});

export default MessagesScreen;
