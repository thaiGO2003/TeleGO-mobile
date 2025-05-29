import React, { useContext, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColor } from "../../../context/ColorContext";
import { AuthContext } from "../../../context/AuthContext";
import {
  addGroupMembers,
  removeGroupMembers,
  deleteGroup,
  setDeputy,
  getGroupById,
  renameGroup,
  updateGroupAvatar,
  leaveGroup,
  changeAdmin,
} from "../../../api/services/groupService";
import { getMessages } from "../../../api/services/messageService";
import { getUserById } from "../../../api/services/userService";
import { Image as ExpoImage } from "expo-image";
import { Video } from "expo-av";
import * as WebBrowser from "expo-web-browser";
import * as ImagePicker from "expo-image-picker";
import AddMembersModal from "../components/AddMembersModal";
import PrimaryButton from "../../../components/common/PrimaryButton";
import WhiteButton from "../../../components/common/WhiteButton";
import { ZEGO_BASE_URL } from "../../../config";
import socket from "../../../utils/socket";
import DateTimePicker from "@react-native-community/datetimepicker";
import GifViewerModal from "../components/GifViewerModal";
import { getGroupQRCode } from "../../../api/services/groupService";
const GroupInfoScreen = ({ route, navigation }) => {
  const { groupId } = route.params || {};
  const { COLORS } = useColor();
  const { user } = useContext(AuthContext);
  const [groupData, setGroupData] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [newAvatar, setNewAvatar] = useState(null);
  const [mediaAndFiles, setMediaAndFiles] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaDateFrom, setMediaDateFrom] = useState(null);
  const [mediaDateTo, setMediaDateTo] = useState(null);
  const [fileDateFrom, setFileDateFrom] = useState(null);
  const [fileDateTo, setFileDateTo] = useState(null);
  const [senderFilter, setSenderFilter] = useState("");
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageViewerData, setImageViewerData] = useState([]);
  const [qrModalVisible, setQRModalVisible] = useState(false);
  const [qrImageUrl, setQRImageUrl] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState({
    type: "",
    section: "",
    visible: false,
  });
  const handleShowQRCode = async () => {
    try {
      const response = await getGroupQRCode(groupId);
      setQRImageUrl(response.qrImageUrl);
      setQRModalVisible(true);
    } catch (error) {
      console.error("Error fetching QR code:", error);
      Alert.alert("Lỗi", error.message || "Không thể lấy mã QR.");
    }
  };
  const getFileIcon = (uri) => {
    const ext = uri?.split(".").pop()?.toLowerCase() || "";
    if (ext === "pdf") return "document-text-outline";
    if (ext === "doc" || ext === "docx") return "document-outline";
    if (ext === "xls" || ext === "xlsx") return "grid-outline";
    if (ext === "ppt" || ext === "pptx") return "document-attach-outline";
    return "document-attach-outline";
  };

  const formatFileSize = (size) => {
    if (!size) return "N/A";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      if (!groupId) throw new Error("Không tìm thấy ID nhóm.");
      const data = await getGroupById(groupId);
      if (!data || !data.groupMembers) {
        throw new Error("Dữ liệu nhóm không hợp lệ.");
      }
      setGroupData(data);
      const memberDetails = await Promise.all(
        data.groupMembers.map(async (memberId) => {
          try {
            const userData = await getUserById(memberId);
            return userData;
          } catch (error) {
            console.error(`Error fetching user ${memberId}:`, error);
            return null;
          }
        })
      );
      setMembers(memberDetails.filter((member) => member !== null));
    } catch (error) {
      console.error("Error fetching group data:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải thông tin nhóm.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMediaAndFiles = async () => {
    try {
      if (!user?._id || !groupId) {
        throw new Error("Thiếu thông tin người dùng hoặc nhóm.");
      }
      const rawMessages = await getMessages(user._id, "", groupId);
      if (!Array.isArray(rawMessages)) {
        throw new Error("Dữ liệu tin nhắn không hợp lệ.");
      }

      // Cache để lưu thông tin người gửi
      const senderCache = {};

      const files = await Promise.all(
        rawMessages
          .filter((msg) => msg?.fileUrls?.length > 0)
          .flatMap(async (msg) => {
            let senderName = "Người dùng";

            // Kiểm tra cache trước
            if (senderCache[msg.sender]) {
              senderName = senderCache[msg.sender];
            } else {
              try {
                const senderData = await getUserById(msg.sender);
                senderName = senderData.fullName || "Người dùng";
                senderCache[msg.sender] = senderName; // Lưu vào cache
              } catch (error) {
                console.error(`Error fetching sender ${msg.sender}:`, error);
              }
            }

            return msg.fileUrls.map((url, index) => ({
              url,
              type: msg.fileTypes?.[index] || "unknown",
              senderId: msg.sender,
              senderName,
              createdAt: msg.createdAt || new Date().toISOString(),
              messageId: msg._id,
              fileSize: msg.fileSizes?.[index] || 0,
              fileName: url?.split("/").pop() || "unknown",
            }));
          })
      );

      // Flatten mảng và sắp xếp
      setMediaAndFiles(
        files
          .flat()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
    } catch (error) {
      console.error("Error fetching media and files:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách phương tiện và file.");
    }
  };

  useEffect(() => {
    if (!user?._id) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng.");
      navigation.goBack();
      return;
    }
    if (groupId) {
      fetchGroupData();
      fetchGroupMediaAndFiles();
    } else {
      Alert.alert("Lỗi", "Không tìm thấy ID nhóm.");
      navigation.goBack();
    }
  }, [groupId, user, navigation]);

  useEffect(() => {
    if (!socket) {
      console.warn("Socket chưa được khởi tạo.");
      return;
    }

    // Xử lý tin nhắn nhóm (đã có trong mã gốc)
    const handleMessageReceive = async (message) => {
      if (message.groupId === groupId && message?.fileUrls?.length > 0) {
        let senderName = "Người dùng";
        try {
          const senderData = await getUserById(message.sender);
          senderName = senderData.fullName || "Người dùng";
        } catch (error) {
          console.error(`Error fetching sender ${message.sender}:`, error);
        }

        const newFiles = message.fileUrls.map((url, index) => ({
          url,
          type: message.fileTypes?.[index] || "unknown",
          senderId: message.sender,
          senderName,
          createdAt: message.createdAt || new Date().toISOString(),
          messageId: message._id,
          fileSize: message.fileSizes?.[index] || 0,
          fileName: url?.split("/").pop() || "unknown",
        }));
        setMediaAndFiles((prev) => [...newFiles, ...prev]);
      }
    };

    // Xử lý thêm thành viên mới vào nhóm
    const handleGroupMemberAdded = async (data) => {
      if (data.groupId === groupId) {
        try {
          const userData = await getUserById(data.addedMemberId);
          if (userData) {
            const newMember = {
              _id: userData._id,
              fullName: userData.fullName || "Unknown",
              avatar: userData.avatar || null,
              lastSeen: "last seen recently",
            };
            setMembers((prev) => [...prev, newMember]);
            setGroupData((prev) => ({
              ...prev,
              groupMembers: [...prev.groupMembers, data.addedMemberId],
            }));
          }
        } catch (error) {
          console.error(
            `Error fetching new member ${data.addedMemberId}:`,
            error
          );
        }
      }
    };

    // Xử lý xóa thành viên hoặc thành viên rời nhóm
    const handleGroupMemberRemoved = (data) => {
      if (data.groupId === groupId) {
        if (data.removedMemberId === user._id) {
          // Nếu người dùng hiện tại bị xóa hoặc rời nhóm
          Alert.alert(
            "Thông báo",
            "Bạn đã bị xóa khỏi nhóm hoặc đã rời nhóm.",
            [{ text: "OK", onPress: () => navigation.navigate("Messages") }]
          );
        } else {
          // Cập nhật danh sách thành viên
          setMembers((prev) =>
            prev.filter((member) => member._id !== data.removedMemberId)
          );
          setGroupData((prev) => ({
            ...prev,
            groupMembers: prev.groupMembers.filter(
              (id) => id !== data.removedMemberId
            ),
          }));
        }
      }
    };

    // Xử lý các cập nhật nhóm (đổi phó nhóm, đổi admin, v.v.)
    const handleGroupUpdated = (data) => {
      if (data.groupId === groupId) {
        setGroupData((prev) => {
          let updatedMembers = prev.groupMembers;
          if (data.removedMembers && Array.isArray(data.removedMembers)) {
            // Xóa các thành viên trong removedMembers khỏi groupMembers
            updatedMembers = prev.groupMembers.filter(
              (id) => !data.removedMembers.includes(id)
            );
          }
          return {
            ...prev,
            groupAdmin: data.newAdminId || prev.groupAdmin,
            groupDeputy: data.newDeputyId
              ? [...prev.groupDeputy, data.newDeputyId]
              : data.removedDeputyId
              ? prev.groupDeputy.filter((id) => id !== data.removedDeputyId)
              : prev.groupDeputy,
            groupMembers: updatedMembers,
          };
        });

        // Cập nhật danh sách members
        if (data.removedMembers && Array.isArray(data.removedMembers)) {
          setMembers((prev) =>
            prev.filter((member) => !data.removedMembers.includes(member._id))
          );
        }
      }
    };

    // Xử lý đổi tên nhóm
    const handleGroupRenamed = (data) => {
      if (data.groupId === groupId) {
        setGroupData((prev) => ({
          ...prev,
          groupName: data.newName,
        }));
      }
    };

    // Xử lý giải tán nhóm
    const handleGroupDeleted = (data) => {
      if (data.groupId === groupId) {
        Alert.alert("Thông báo", "Nhóm đã bị giải tán.", [
          { text: "OK", onPress: () => navigation.navigate("Messages") },
        ]);
      }
    };

    // Xử lý cập nhật ảnh đại diện nhóm
    const handleAvatarUpdated = (data) => {
      if (data.groupId === groupId) {
        setGroupData((prev) => ({
          ...prev,
          avatar: data.avatar,
        }));
      }
    };

    // Đăng ký các sự kiện Socket.IO
    socket.on("group-msg-receive", handleMessageReceive);
    socket.on("groupMemberAdded", handleGroupMemberAdded);
    socket.on("groupMemberRemoved", handleGroupMemberRemoved);
    socket.on("groupUpdated", handleGroupUpdated);
    socket.on("groupRenamed", handleGroupRenamed);
    socket.on("groupDeleted", handleGroupDeleted);
    socket.on("avatarUpdated", handleAvatarUpdated);

    // Dọn dẹp khi component unmount
    return () => {
      socket.off("group-msg-receive", handleMessageReceive);
      socket.off("groupMemberAdded", handleGroupMemberAdded);
      socket.off("groupMemberRemoved", handleGroupMemberRemoved);
      socket.off("groupUpdated", handleGroupUpdated);
      socket.off("groupRenamed", handleGroupRenamed);
      socket.off("groupDeleted", handleGroupDeleted);
      socket.off("avatarUpdated", handleAvatarUpdated);
    };
  }, [groupId, user._id, navigation]);

  const handleVideoCall = async () => {
    try {
      if (!groupId) {
        Alert.alert("Thông báo", "Không tìm thấy ID nhóm.");
        return;
      }
      const videoCallUrl = `${ZEGO_BASE_URL}?roomID=${groupId}&userID=${user._id}`;
      await WebBrowser.openBrowserAsync(videoCallUrl);
    } catch (error) {
      console.error("Error opening video call:", error);
      Alert.alert("Lỗi", "Không thể khởi động cuộc gọi video.");
    }
  };

  const handleLeaveGroup = () => {
    if (!groupData) return;
    if (user._id === groupData.groupAdmin) {
      Alert.alert(
        "Thông báo",
        "Bạn là trưởng nhóm. Vui lòng chuyển quyền trưởng nhóm trong danh sách thành viên trước khi rời nhóm.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }
    Alert.alert("Xác nhận", "Bạn có chắc muốn thoát nhóm?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Thoát",
        style: "destructive",
        onPress: async () => {
          try {
            await leaveGroup(groupId, user._id);
            // Trì hoãn điều hướng để socket xử lý sự kiện
            setTimeout(() => {
              Alert.alert("Thành công", "Đã thoát khỏi nhóm.");
              navigation.navigate("Messages");
            }, 1500); // Chờ 1 giây
          } catch (error) {
            console.error("Error leaving group:", error);
            Alert.alert("Lỗi", "Không thể thoát nhóm vào lúc này.");
          }
        },
      },
    ]);
  };
  const handleAddMembers = () => {
    setModalVisible(true);
  };

  const handleConfirmAddMembers = async (selectedUserIds) => {
    try {
      await addGroupMembers(groupId, selectedUserIds);
      Alert.alert("Thành công", "Đã thêm thành viên vào nhóm.");
      const newMembers = await Promise.all(
        selectedUserIds.map(async (id) => {
          try {
            const userData = await getUserById(id);
            return {
              _id: userData._id,
              fullName: userData.fullName || "Unknown",
              avatar: userData.avatar || null,
              lastSeen: "last seen recently",
            };
          } catch (error) {
            console.error(`Error fetching user ${id}:`, error);
            return null;
          }
        })
      );
      const validNewMembers = newMembers.filter((member) => member !== null);
      setMembers([...members, ...validNewMembers]);
      setGroupData({
        ...groupData,
        groupMembers: [...groupData.groupMembers, ...selectedUserIds],
      });
    } catch (error) {
      console.error("Error adding members:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể thêm thành viên vào lúc này."
      );
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!groupData) return;
    if (userId === groupData.groupAdmin) {
      Alert.alert("Thông báo", "Không thể xóa trưởng nhóm.");
      return;
    }
    if (!groupData.groupMembers.includes(userId)) {
      Alert.alert("Thông báo", "Thành viên không thuộc nhóm này.");
      return;
    }
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa thành viên này khỏi nhóm?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await removeGroupMembers(groupId, [userId], user._id);
            setMembers(members.filter((member) => member._id !== userId));
            setGroupData({
              ...groupData,
              groupMembers: groupData.groupMembers.filter(
                (id) => id !== userId
              ),
            });
            Alert.alert("Thành công", "Đã xóa thành viên khỏi nhóm.");
          } catch (error) {
            console.error(
              "Error removing member:",
              error.response?.data || error.message
            );
            Alert.alert(
              "Lỗi",
              error.response?.data?.error ||
                "Không thể xóa thành viên vào lúc này."
            );
          }
        },
      },
    ]);
  };

  const handleChangeAdmin = async (newAdminId) => {
    if (!groupData) return;
    if (newAdminId === groupData.groupAdmin) {
      Alert.alert("Thông báo", "Thành viên này đã là trưởng nhóm.");
      return;
    }
    if (!groupData.groupMembers.includes(newAdminId)) {
      Alert.alert("Thông báo", "Thành viên không thuộc nhóm này.");
      return;
    }
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc muốn chuyển quyền trưởng nhóm cho thành viên này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Chuyển",
          style: "default",
          onPress: async () => {
            try {
              await changeAdmin(groupId, user._id, newAdminId);
              setGroupData({ ...groupData, groupAdmin: newAdminId });
              Alert.alert("Thành công", "Đã chuyển quyền trưởng nhóm.");
              fetchGroupData(); // Refresh to ensure UI consistency
            } catch (error) {
              console.error("Error changing admin:", error);
              Alert.alert(
                "Lỗi",
                error.message || "Không thể chuyển trưởng nhóm vào lúc này."
              );
            }
          },
        },
      ]
    );
  };

  const handleDisbandGroup = () => {
    if (!groupData) return;
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc muốn giải tán nhóm? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Giải tán",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGroup(groupId, user._id);
              Alert.alert("Thành công", "Nhóm đã được giải tán.");
              navigation.navigate("Messages");
            } catch (error) {
              console.error("Error disbanding group:", error);
              Alert.alert("Lỗi", "Không thể giải tán nhóm vào lúc này.");
            }
          },
        },
      ]
    );
  };

  const handleRenameGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tên nhóm.");
      return;
    }
    try {
      await renameGroup(groupId, user._id, newGroupName);
      setGroupData({ ...groupData, groupName: newGroupName });
      setRenameModalVisible(false);
      setNewGroupName("");
      Alert.alert("Thành công", "Đã đổi tên nhóm.");
    } catch (error) {
      console.error("Error renaming group:", error);
      Alert.alert("Lỗi", error.message || "Không thể đổi tên nhóm.");
    }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Cần cấp quyền truy cập thư viện ảnh.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setNewAvatar(result.assets[0].uri);
    }
  };

  const handleConfirmAvatar = async () => {
    if (!newAvatar) {
      Alert.alert("Thông báo", "Vui lòng chọn ảnh.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("avatar", {
        uri: newAvatar,
        type: "image/jpeg",
        name: `group-${groupId}.jpg`,
      });
      await updateGroupAvatar(groupId, formData);
      setAvatarModalVisible(false);
      setNewAvatar(null);
      fetchGroupData();
      Alert.alert("Thành công", "Đã cập nhật ảnh nhóm.");
    } catch (error) {
      console.error("Error updating avatar:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật ảnh nhóm.");
    }
  };

  const handleEditGroup = () => {
    Alert.alert("Chỉnh sửa nhóm", "Chọn hành động:", [
      {
        text: "Đổi tên nhóm",
        onPress: () => {
          setNewGroupName(groupData?.groupName || "");
          setRenameModalVisible(true);
        },
      },
      {
        text: "Đổi ảnh nhóm",
        onPress: () => setAvatarModalVisible(true),
      },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  const filteredMedia = useMemo(() => {
    return mediaAndFiles.filter((item) => {
      const isMedia =
        item.type.startsWith("image/") || item.type.startsWith("video/");
      if (!isMedia) return false;
      const matchesSender = senderFilter
        ? item.senderId === senderFilter
        : true;
      const matchesDate =
        (!mediaDateFrom || new Date(item.createdAt) >= mediaDateFrom) &&
        (!mediaDateTo || new Date(item.createdAt) <= mediaDateTo);
      return matchesSender && matchesDate;
    });
  }, [mediaAndFiles, senderFilter, mediaDateFrom, mediaDateTo]);

  const filteredFiles = useMemo(() => {
    return mediaAndFiles.filter((item) => {
      const isFile =
        !item.type.startsWith("image/") && !item.type.startsWith("video/");
      if (!isFile) return false;
      const ext = item.url?.split(".").pop()?.toLowerCase() || "";
      const matchesType =
        filterType === "all" ||
        (filterType === "pdf" && ext === "pdf") ||
        (filterType === "word" && ["doc", "docx"].includes(ext)) ||
        (filterType === "excel" && ["xls", "xlsx"].includes(ext)) ||
        (filterType === "ppt" && ["ppt", "pptx"].includes(ext));
      const matchesName = searchQuery
        ? item.fileName?.toLowerCase()?.includes(searchQuery.toLowerCase())
        : true;
      const matchesDate =
        (!fileDateFrom || new Date(item.createdAt) >= fileDateFrom) &&
        (!fileDateTo || new Date(item.createdAt) <= fileDateTo);
      return matchesType && matchesName && matchesDate;
    });
  }, [mediaAndFiles, filterType, searchQuery, fileDateFrom, fileDateTo]);

  const functionButtons = useMemo(
    () => [
      {
        id: "qrcode",
        icon: "qr-code-outline",
        title: "Mã QR của Group",
        color: "#FF9800",
        action: handleShowQRCode,
      },
      {
        id: "videochat",
        icon: "videocam",
        title: "Gọi video call",
        color: "#2196F3",
        action: handleVideoCall,
      },
      ...(groupData && user._id === groupData.groupAdmin
        ? [
            {
              id: "disband",
              icon: "trash",
              title: "Giải tán nhóm",
              color: "#F44336",
              action: handleDisbandGroup,
            },
          ]
        : []),
      {
        id: "leave",
        icon: "log-out",
        title: "Rời nhóm",
        color: "#F44336",
        action: handleLeaveGroup,
      },
    ],
    [groupData, user._id]
  );

  const renderHeader = () => (
    <>
      {/* Group Profile */}
      <View style={styles.profileSection}>
        {groupData.avatar ? (
          <ExpoImage
            source={{ uri: groupData.avatar }}
            style={styles.avatarLarge}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>
              {groupData.groupName?.charAt(0) || "U"}
            </Text>
          </View>
        )}
        <Text style={styles.groupName}>{groupData.groupName}</Text>
        <Text style={styles.groupMemberCount}>{members.length} thành viên</Text>
      </View>

      {/* Function Buttons */}
      <View style={styles.functionButtons}>
        {functionButtons.map((button) => (
          <TouchableOpacity
            key={button.id}
            style={styles.functionButton}
            onPress={button.action}
          >
            <Ionicons name={button.icon} size={24} color={button.color} />
            <Text style={[styles.functionText, { color: button.color }]}>
              {button.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Members Button */}
      {user._id === groupData.groupAdmin && (
        <TouchableOpacity
          style={styles.addMembersButton}
          onPress={handleAddMembers}
        >
          <Ionicons name="person-add" size={24} color="#2196F3" />
          <Text style={styles.addMembersText}>Thêm thành viên</Text>
        </TouchableOpacity>
      )}

      {/* Members List */}
      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>Thành viên</Text>
        <FlatList
  data={members}
  scrollEnabled={false}
  keyExtractor={(item) => item._id}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={styles.memberItem}
      onPress={() => navigation.navigate("Profile", { userId: item._id })}
    >
      {item.avatar ? (
        <ExpoImage
          source={{ uri: item.avatar }}
          style={styles.memberAvatar}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>
            {item.fullName ? item.fullName.charAt(0) : "U"}
          </Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.fullName}</Text>
        <Text style={styles.memberStatus}>
          {item._id === groupData.groupAdmin ? "Trưởng nhóm" : item.lastSeen}
        </Text>
      </View>
      {user._id === groupData.groupAdmin && item._id !== user._id && (
        <View style={styles.memberActions}>
          {item._id === groupData.groupAdmin ? (
            <Text style={styles.adminTag}>Trưởng nhóm</Text>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => handleChangeAdmin(item._id)}
                style={styles.actionButton}
              >
                <Ionicons name="star" size={20} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRemoveMember(item._id)}
                style={styles.actionButton}
              >
                <Ionicons name="person-remove" size={20} color="#F44336" />
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  )}
/>
      </View>

      {/* Media Section */}
      <View style={styles.mediaFilesSection}>
        <Text style={styles.sectionTitle}>Phương tiện</Text>
        <View style={styles.filterContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Lọc theo người gửi..."
            value={senderFilter}
            onChangeText={setSenderFilter}
          />
          <View style={styles.dateFilterContainer}>
            <TouchableOpacity
              onPress={() =>
                setShowDatePicker({
                  type: "mediaFrom",
                  section: "media",
                  visible: true,
                })
              }
            >
              <Text style={styles.dateFilterText}>
                Từ:{" "}
                {mediaDateFrom
                  ? mediaDateFrom.toLocaleDateString()
                  : "Chọn ngày"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setShowDatePicker({
                  type: "mediaTo",
                  section: "media",
                  visible: true,
                })
              }
              style={styles.dateFilterButton}
            >
              <Text style={styles.dateFilterText}>
                Đến:{" "}
                {mediaDateTo ? mediaDateTo.toLocaleDateString() : "Chọn ngày"}
              </Text>
            </TouchableOpacity>
            {(mediaDateFrom || mediaDateTo) && (
              <TouchableOpacity
                onPress={() => {
                  setMediaDateFrom(null);
                  setMediaDateTo(null);
                }}
                style={styles.clearFilterButton}
              >
                <Ionicons name="close-circle" size={20} color="#F44336" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {showDatePicker.visible && showDatePicker.section === "media" && (
          <DateTimePicker
            value={mediaDateFrom || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker({ type: "", section: "", visible: false });
              if (selectedDate) {
                if (showDatePicker.type === "mediaFrom")
                  setMediaDateFrom(selectedDate);
                else setMediaDateTo(selectedDate);
              }
            }}
          />
        )}
        {filteredMedia.length === 0 ? (
          <Text style={styles.noMediaText}>Chưa có phương tiện nào.</Text>
        ) : (
          <FlatList
            data={filteredMedia}
            keyExtractor={(item, index) => `${item.messageId}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.mediaItem}
                onPress={() => {
                  if (item.type.startsWith("image/")) {
                    const imageItems = filteredMedia.filter((f) =>
                      f.type.startsWith("image/")
                    );
                    const imageIndex = imageItems.findIndex(
                      (img) => img.url === item.url
                    );
                    setSelectedImageIndex(imageIndex);
                    setImageViewerData(imageItems.map((f) => ({ uri: f.url })));
                    setImageViewerVisible(true);
                  }
                }}
                disabled={!item.type.startsWith("image/")}
              >
                {item.type.startsWith("image/") ? (
                  <ExpoImage
                    source={{ uri: item.url }}
                    style={styles.mediaPreview}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <Video
                    source={{ uri: item.url }}
                    style={styles.mediaPreview}
                    useNativeControls
                    resizeMode="cover"
                    isMuted
                    shouldPlay={false}
                  />
                )}
                <Text style={styles.mediaInfo}>Gửi bởi: {item.senderName}</Text>
                <Text style={styles.mediaInfo}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </>
  );

  if (loading || !groupData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[{ key: "files" }]} // Dummy data để render Files Section
        renderItem={() => null}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={() => (
          <View style={styles.mediaFilesSection}>
            <Text style={styles.sectionTitle}>File</Text>
            <View style={styles.filterContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm tên file..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <View style={styles.filterButtons}>
                {["all", "pdf", "word", "excel", "ppt"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterButton,
                      filterType === type && styles.filterButtonActive,
                    ]}
                    onPress={() => setFilterType(type)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        filterType === type && styles.filterButtonTextActive,
                      ]}
                    >
                      {type === "all" ? "Tất cả" : type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.dateFilterContainer}>
                <TouchableOpacity
                  onPress={() =>
                    setShowDatePicker({
                      type: "fileFrom",
                      section: "file",
                      visible: true,
                    })
                  }
                >
                  <Text style={styles.dateFilterText}>
                    Từ:{" "}
                    {fileDateFrom
                      ? fileDateFrom.toLocaleDateString()
                      : "Chọn ngày"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setShowDatePicker({
                      type: "fileTo",
                      section: "file",
                      visible: true,
                    })
                  }
                  style={styles.dateFilterButton}
                >
                  <Text style={styles.dateFilterText}>
                    Đến:{" "}
                    {fileDateTo ? fileDateTo.toLocaleDateString() : "Chọn ngày"}
                  </Text>
                </TouchableOpacity>
                {(fileDateFrom || fileDateTo) && (
                  <TouchableOpacity
                    onPress={() => {
                      setFileDateFrom(null);
                      setFileDateTo(null);
                    }}
                    style={styles.clearFilterButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#F44336" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {showDatePicker.visible && showDatePicker.section === "file" && (
              <DateTimePicker
                value={fileDateFrom || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker({ type: "", section: "", visible: false });
                  if (selectedDate) {
                    if (showDatePicker.type === "fileFrom")
                      setFileDateFrom(selectedDate);
                    else setFileDateTo(selectedDate);
                  }
                }}
              />
            )}
            {filteredFiles.length === 0 ? (
              <Text style={styles.noMediaText}>Chưa có file nào.</Text>
            ) : (
              <FlatList
                data={filteredFiles}
                keyExtractor={(item, index) => `${item.messageId}-${index}`}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.fileItem}
                    onPress={() =>
                      Linking.openURL(item.url).catch(() =>
                        Alert.alert("Lỗi", "Không thể mở file.")
                      )
                    }
                  >
                    <Ionicons
                      name={getFileIcon(item.url)}
                      size={40}
                      color="#2196F3"
                    />
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {item.fileName}
                      </Text>
                      <Text style={styles.fileMeta}>
                        Gửi bởi: {item.senderName}
                      </Text>
                      <Text style={styles.fileMeta}>
                        {new Date(item.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}
      />

      {/* Add Members Modal */}
      <AddMembersModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirmAddMembers}
        groupId={groupId}
        groupMembers={groupData.groupMembers}
      />

      {/* Rename Group Modal */}
      <Modal visible={renameModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi tên nhóm</Text>
            <TextInput
              style={styles.input}
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Nhập tên nhóm mới"
            />
            <PrimaryButton
              onPress={handleRenameGroup}
              style={styles.confirmButton}
              title="Lưu"
            />
            <WhiteButton
              onPress={() => {
                setRenameModalVisible(false);
                setNewGroupName("");
              }}
              style={styles.cancelButton}
              title="Hủy"
            />
          </View>
        </View>
      </Modal>

      <GifViewerModal
        images={imageViewerData}
        imageIndex={selectedImageIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
        onIndexChange={(newIndex) => setSelectedImageIndex(newIndex)}
      />

      {/* Change Avatar Modal */}
      <Modal visible={avatarModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi ảnh nhóm</Text>
            {newAvatar ? (
              <ExpoImage
                source={{ uri: newAvatar }}
                style={styles.avatarPreview}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <Text style={styles.noAvatarText}>Chưa chọn ảnh</Text>
            )}
            <PrimaryButton
              onPress={handlePickAvatar}
              style={styles.confirmButton}
              title="Chọn ảnh"
            />
            <PrimaryButton
              onPress={handleConfirmAvatar}
              style={styles.confirmButton}
              title="Lưu"
              disabled={!newAvatar}
            />
            <WhiteButton
              onPress={() => {
                setAvatarModalVisible(false);
                setNewAvatar(null);
              }}
              style={styles.cancelButton}
              title="Hủy"
            />
          </View>
        </View>
      </Modal>
      {/* QR Code Modal */}
      <Modal visible={qrModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mã QR Nhóm</Text>
            {qrImageUrl ? (
              <ExpoImage
                source={{ uri: qrImageUrl }}
                style={styles.qrImage}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            ) : (
              <Text style={styles.noAvatarText}>Đang tải mã QR...</Text>
            )}
            <WhiteButton
              onPress={() => {
                setQRModalVisible(false);
                setQRImageUrl(null);
              }}
              style={styles.cancelButton}
              title="Đóng"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#FFF",
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  avatarTextLarge: {
    color: "#FFF",
    fontSize: 36,
    fontWeight: "bold",
  },
  groupName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  groupMemberCount: {
    fontSize: 16,
    color: "#666",
  },
  functionButtons: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingVertical: 15,
    marginTop: 1,
    justifyContent: "space-around",
  },
  functionButton: {
    alignItems: "center",
    width: 70,
  },
  functionText: {
    marginTop: 5,
    fontSize: 12,
  },
  addMembersButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    marginTop: 20,
    marginBottom: 1,
  },
  addMembersText: {
    marginLeft: 15,
    fontSize: 16,
    color: "#2196F3",
  },
  membersSection: {
    backgroundColor: "#FFF",
    paddingVertical: 10,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  memberAvatarText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  memberInfo: {
    flex: 1,
    marginLeft: 15,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
  },
  memberStatus: {
    fontSize: 14,
    color: "#666",
  },
  ownerTag: {
    fontSize: 14,
    color: "#888",
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginLeft: 10,
    padding: 5,
  },
  loadingText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#000000aa",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  confirmButton: {
    marginTop: 10,
  },
  cancelButton: {
    marginTop: 5,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 15,
  },
  noAvatarText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginVertical: 20,
  },
  mediaFilesSection: {
    backgroundColor: "#FFF",
    paddingVertical: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  noMediaText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    padding: 20,
  },
  mediaItem: {
    marginHorizontal: 5,
    borderRadius: 10,
    overflow: "hidden",
    width: 120,
  },
  mediaPreview: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  mediaInfo: {
    fontSize: 12,
    color: "#333",
    marginTop: 5,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  fileInfo: {
    flex: 1,
    marginLeft: 10,
  },
  fileName: {
    fontSize: 14,
    color: "#333",
  },
  fileMeta: {
    fontSize: 12,
    color: "#666",
  },
  filterContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  filterButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: "#E0E0E0",
    marginRight: 5,
    marginBottom: 5,
  },
  filterButtonActive: {
    backgroundColor: "#2196F3",
  },
  filterButtonText: {
    fontSize: 12,
    color: "#333",
  },
  filterButtonTextActive: {
    color: "#FFF",
  },
  dateFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  dateFilterButton: {
    marginLeft: 15,
  },
  dateFilterText: {
    fontSize: 14,
    color: "#2196F3",
  },
  clearFilterButton: {
    marginLeft: 15,
  },
  adminTag: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  qrImage: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginBottom: 15,
  },
});

export default GroupInfoScreen;
