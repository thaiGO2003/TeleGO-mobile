import React, { useContext, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColor } from "../../../context/ColorContext";
import { AuthContext } from "../../../context/AuthContext";
import { getMessages } from "../../../api/services/messageService";
import { getUserById } from "../../../api/services/userService";
import { Image as ExpoImage } from "expo-image";
import { Video } from "expo-av";
import * as WebBrowser from "expo-web-browser";
import GifViewerModal from "../components/GifViewerModal";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ZEGO_BASE_URL } from "../../../config";
import socket from "../../../utils/socket";

const InfoScreen = ({ route, navigation }) => {
  const { otherUserId } = route.params || {};
  const { COLORS } = useColor();
  const { user } = useContext(AuthContext);
  const [friendData, setFriendData] = useState(null);
  const [loading, setLoading] = useState(true);
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
  const [showDatePicker, setShowDatePicker] = useState({
    type: "",
    section: "",
    visible: false,
  });

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

  const fetchFriendData = async () => {
    try {
      setLoading(true);
      if (!otherUserId) throw new Error("Không tìm thấy ID người dùng.");
      const data = await getUserById(otherUserId);
      if (!data) throw new Error("Dữ liệu người dùng không hợp lệ.");
      setFriendData(data);
    } catch (error) {
      console.error("Error fetching friend data:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải thông tin người dùng.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchMediaAndFiles = async () => {
    try {
      if (!user?._id || !otherUserId) {
        throw new Error("Thiếu thông tin người dùng.");
      }
      const rawMessages = await getMessages(user._id, otherUserId);
      if (!Array.isArray(rawMessages)) {
        throw new Error("Dữ liệu tin nhắn không hợp lệ.");
      }

      const senderCache = { [user._id]: user.fullName };
      if (!senderCache[otherUserId]) {
        const friend = await getUserById(otherUserId);
        senderCache[otherUserId] = friend.fullName || "Người dùng";
      }

      const files = await Promise.all(
        rawMessages
          .filter((msg) => msg?.fileUrls?.length > 0)
          .flatMap(async (msg) => {
            const senderName = senderCache[msg.sender] || "Người dùng";
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
    if (otherUserId) {
      fetchFriendData();
      fetchMediaAndFiles();
    } else {
      Alert.alert("Lỗi", "Không tìm thấy ID người dùng.");
      navigation.goBack();
    }
  }, [otherUserId, user, navigation]);

  useEffect(() => {
    if (!socket) {
      console.warn("Socket chưa được khởi tạo.");
      return;
    }

    const handleMessageReceive = async (message) => {
      if (message.from === otherUserId && message?.fileUrls?.length > 0) {
        const senderName = senderCache[message.sender] || friendData?.fullName || "Người dùng";
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

    socket.on("msg-receive", handleMessageReceive);

    return () => {
      socket.off("msg-receive", handleMessageReceive);
    };
  }, [otherUserId, friendData]);

  const handleVideoCall = async () => {
    try {
      if (!otherUserId) {
        Alert.alert("Thông báo", "Không tìm thấy ID người dùng.");
        return;
      }
      const roomId = [user._id, otherUserId].sort().join("_");
      const videoCallUrl = `${ZEGO_BASE_URL}?roomID=${roomId}&userID=${user._id}`;
      await WebBrowser.openBrowserAsync(videoCallUrl);
    } catch (error) {
      console.error("Error opening video call:", error);
      Alert.alert("Lỗi", "Không thể khởi động cuộc gọi video.");
    }
  };

  const filteredMedia = useMemo(() => {
    return mediaAndFiles.filter((item) => {
      const isMedia = item.type.startsWith("image/") || item.type.startsWith("video/");
      if (!isMedia) return false;
      const matchesSender = senderFilter ? item.senderId === senderFilter : true;
      const matchesDate =
        (!mediaDateFrom || new Date(item.createdAt) >= mediaDateFrom) &&
        (!mediaDateTo || new Date(item.createdAt) <= mediaDateTo);
      return matchesSender && matchesDate;
    });
  }, [mediaAndFiles, senderFilter, mediaDateFrom, mediaDateTo]);

  const filteredFiles = useMemo(() => {
    return mediaAndFiles.filter((item) => {
      const isFile = !item.type.startsWith("image/") && !item.type.startsWith("video/");
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
        id: "videochat",
        icon: "videocam",
        title: "video chat",
        color: "#2196F3",
        action: handleVideoCall,
      },
    ],
    []
  );

  const renderHeader = () => (
    <>
      <View style={styles.profileSection}>
        {friendData?.avatar ? (
          <ExpoImage
            source={{ uri: friendData.avatar }}
            style={styles.avatarLarge}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>
              {friendData?.fullName?.charAt(0) || "U"}
            </Text>
          </View>
        )}
        <Text style={styles.groupName}>{friendData?.fullName}</Text>
        <Text style={styles.groupMemberCount}>
          {friendData?.lastSeen || "last seen recently"}
        </Text>
      </View>

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
                Từ: {mediaDateFrom ? mediaDateFrom.toLocaleDateString() : "Chọn ngày"}
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
                Đến: {mediaDateTo ? mediaDateTo.toLocaleDateString() : "Chọn ngày"}
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
                if (showDatePicker.type === "mediaFrom") setMediaDateFrom(selectedDate);
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
                    const imageIndex = imageItems.findIndex((img) => img.url === item.url);
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

  if (loading || !friendData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[{ key: "files" }]}
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
                    Từ: {fileDateFrom ? fileDateFrom.toLocaleDateString() : "Chọn ngày"}
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
                    Đến: {fileDateTo ? fileDateTo.toLocaleDateString() : "Chọn ngày"}
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
                    if (showDatePicker.type === "fileFrom") setFileDateFrom(selectedDate);
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
                    <Ionicons name={getFileIcon(item.url)} size={40} color="#2196F3" />
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {item.fileName}
                      </Text>
                      <Text style={styles.fileMeta}>Gửi bởi: {item.senderName}</Text>
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

      <GifViewerModal
        images={imageViewerData}
        imageIndex={selectedImageIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
        onIndexChange={(newIndex) => setSelectedImageIndex(newIndex)}
      />
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
});

export default InfoScreen;