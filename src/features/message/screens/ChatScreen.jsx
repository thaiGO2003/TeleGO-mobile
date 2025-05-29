import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Text,
  Image,
  Alert,
  FlatList,
  LogBox,
  TouchableNativeFeedback,
  Platform,
  Modal,
  Keyboard,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useTranslation } from "react-i18next";
import { Dimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  sendMediaMessage,
  recallMessage,
  deleteMessageForMe,
  getMessages,
  reactToMessage,
  unreactToMessage,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  votePoll,
  removeVote,
} from "../../../api/services/messageService";
import BirthdayBanner from "../components/BirthdayBanner";
import { Video } from "expo-av";
import { useModal } from "../../../context/ModalContext";
import GifModal from "../components/GifModal";
import ForwardModal from "../components/ForwardModal";
import ReactionModal from "../components/ReactionModal";
import MessageActionSheet from "../components/MessageActionSheet";
import { GiftedChat, Send, InputToolbar } from "react-native-gifted-chat";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../../context/AuthContext";
import CommonPrimaryContainer from "../../../components/layout/CommonPrimaryContainer";
import socket from "../../../utils/socket";
import GifViewerModal from "../components/GifViewerModal";
import {
  getMembersInGroup,
  getGroupById,
} from "../../../api/services/groupService";
import { getUserById } from "../../../api/services/userService";

LogBox.ignoreLogs([
  "Warning: Text strings must be rendered within a <Text> component.",
]);

const ChatScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const { user } = useContext(AuthContext);
  const [groupInfo, setGroupInfo] = useState(null);
  const { otherUserIds, groupId } = route.params;
  const percentWidth = 100;
  const [isSending, setIsSending] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;
  const [pendingFiles, setPendingFiles] = useState([]);
  const [otherUsers, setOtherUsers] = useState([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageViewerData, setImageViewerData] = useState([]);
  const [messageToForward, setMessageToForward] = useState(null);
  const chatRef = useRef(null);
  const [isGifModalVisible, setIsGifModalVisible] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isWidgetBarVisible, setIsWidgetBarVisible] = useState(false);
  const [messageActionSheetVisible, setMessageActionSheetVisible] =
    useState(false);
  const [selectedMessageForAction, setSelectedMessageForAction] =
    useState(null);
  const [reactionModalVisible, setReactionModalVisible] = useState(false);
  const [selectedMessageReactions, setSelectedMessageReactions] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const emojiOptions = ["👍", "❤️", "😆", "😲", "😢", "😡"];
  const isGroupChat = !!groupId;
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const { modalVisible, setModalVisible } = useModal();
  const [birthdayFriends, setBirthdayFriends] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [isSearchResultsModalVisible, setIsSearchResultsModalVisible] =
    useState(false);
  const SearchResultsModal = () => {
    const renderSearchResultItem = ({ item }) => {
      const { msg, index } = item;
      const isMine = msg.user?._id === user._id;
      const displayContent = msg.recalled
        ? t("message.recalled")
        : msg.text?.trim() || (msg.files?.length > 0 ? "[Media]" : "");

      return (
        <TouchableOpacity
          style={styles.searchResultItem}
          onPress={() => {
            setIsSearchResultsModalVisible(false);
            flatListRef.current?.scrollToIndex({
              index,
              animated: true,
              viewPosition: 0.5,
            });
          }}
        >
          <ExpoImage
            source={{
              uri: msg.user?.avatar || "https://via.placeholder.com/40",
            }}
            style={styles.searchResultAvatar}
          />
          <View style={styles.searchResultContent}>
            <Text style={styles.searchResultSender} numberOfLines={1}>
              {msg.user?.name || "Người dùng"}
            </Text>
            <Text style={styles.searchResultText} numberOfLines={2}>
              {displayContent}
            </Text>
            <Text style={styles.searchResultTime}>
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <Modal
        visible={isSearchResultsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSearchResultsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.searchResultsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("message.search.results")} ({searchResults.length})
              </Text>
              <TouchableOpacity
                onPress={() => setIsSearchResultsModalVisible(false)}
                style={styles.closeModalButton}
              >
                <Ionicons name="close" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResultItem}
                keyExtractor={(item) => item.msg._id}
                style={styles.searchResultsList}
              />
            ) : (
              <Text style={styles.noResultsText}>
                {t("message.search.noResults")}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    );
  };
  useFocusEffect(
    React.useCallback(() => {
      if (user && (otherUsers.length > 0 || isGroupChat)) {
        fetchMessages();
      }
    }, [user, otherUsers, isGroupChat, fetchMessages])
  );

  const customHeader = (
    <View style={styles.customHeader}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="#2C3E50" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.headerContent}
        onPress={() => {
          if (isGroupChat && groupInfo) {
            try {
              navigation.navigate("GroupInfo", {
                groupId,
                groupName: groupInfo.groupName,
                groupMembers: groupInfo.groupMembers,
                groupAvatar: groupInfo.avatar,
              });
            } catch (error) {
              console.error("Navigation to GroupInfo failed:", error);
              Alert.alert("Lỗi", "Không thể truy cập thông tin nhóm.");
            }
          } else if (otherUsers[0]?._id) {
            try {
              navigation.navigate("Info", {
                otherUserId: otherUsers[0]._id,
              });
            } catch (error) {
              console.error("Navigation to InfoScreen failed:", error);
              Alert.alert("Lỗi", "Không thể truy cập thông tin người dùng.");
            }
          }
        }}
      >
        <ExpoImage
          source={{
            uri: isGroupChat
              ? groupInfo?.avatar || "https://via.placeholder.com/40"
              : otherUsers[0]?.avatar || "https://via.placeholder.com/40",
          }}
          style={styles.headerAvatar}
        />
        <Text style={styles.headerName} numberOfLines={1}>
          {isGroupChat
            ? groupInfo?.groupName || "Nhóm"
            : otherUsers[0]?.fullName || "Người dùng"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => setIsSearchVisible((prev) => !prev)}
      >
        <Ionicons
          name={isSearchVisible ? "close" : "search"}
          size={24}
          color="#2C3E50"
        />
      </TouchableOpacity>
    </View>
  );
  const renderSearchBar = () => {
    if (!isSearchVisible) return null;

    return (
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder={t("message.search.placeholder")}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color="#7F8C8D" />
          </TouchableOpacity>
        )}
        <View style={styles.searchNavigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              searchResults.length === 0 && styles.navButtonDisabled,
            ]}
            onPress={handlePrevResult}
            disabled={searchResults.length === 0}
          >
            <Ionicons name="arrow-down" size={20} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.resultCount}>
            {searchResults.length > 0
              ? `${currentResultIndex + 1}/${searchResults.length}`
              : "0/0"}
          </Text>
          <TouchableOpacity
            style={[
              styles.navButton,
              searchResults.length === 0 && styles.navButtonDisabled,
            ]}
            onPress={handleNextResult}
            disabled={searchResults.length === 0}
          >
            <Ionicons name="arrow-up" size={20} color="#2C3E50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setIsSearchResultsModalVisible(true)}
          >
            <Ionicons name="list" size={20} color="#2C3E50" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      return;
    }

    const results = messages
      .map((msg, index) => ({ msg, index }))
      .filter(({ msg }) =>
        msg.text?.toLowerCase().includes(query.toLowerCase())
      );

    setSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);

    if (results.length > 0) {
      flatListRef.current?.scrollToIndex({
        index: results[0].index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  };

  const handleNextResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex =
      currentResultIndex === searchResults.length - 1
        ? 0
        : currentResultIndex + 1;
    setCurrentResultIndex(nextIndex);
    flatListRef.current?.scrollToIndex({
      index: searchResults[nextIndex].index,
      animated: true,
      viewPosition: 0.5,
    });
  };

  const handlePrevResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex =
      currentResultIndex === 0
        ? searchResults.length - 1
        : currentResultIndex - 1;
    setCurrentResultIndex(prevIndex);
    flatListRef.current?.scrollToIndex({
      index: searchResults[prevIndex].index,
      animated: true,
      viewPosition: 0.5,
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setCurrentResultIndex(-1);
  };
  const isBirthdayToday = (birthDate) => {
    if (!birthDate) return false;
    const today = new Date();
    let day, month;

    if (birthDate.includes("/")) {
      [day, month] = birthDate.split("/").map(Number);
    } else if (birthDate.includes("-")) {
      const date = new Date(birthDate);
      day = date.getDate();
      month = date.getMonth() + 1;
    } else {
      console.warn(`Invalid birthDate format: ${birthDate}`);
      return false;
    }

    const isBirthday =
      today.getDate() === day && today.getMonth() + 1 === month;
    console.log(`Checking birthday: ${birthDate} -> ${isBirthday}`);
    return isBirthday;
  };

  useEffect(() => {
    if (isSending) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [isSending]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    const anyModalOpen =
      forwardModalVisible ||
      imageViewerVisible ||
      isGifModalVisible ||
      messageActionSheetVisible ||
      reactionModalVisible ||
      isSearchResultsModalVisible;

    setModalVisible(anyModalOpen);
  }, [
    forwardModalVisible,
    imageViewerVisible,
    isGifModalVisible,
    messageActionSheetVisible,
    reactionModalVisible,
    isSearchResultsModalVisible,
  ]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  const fetchPinnedMessages = async () => {
    try {
      const to = isGroupChat ? null : otherUserIds[0] || null;
      const groupIdParam = isGroupChat ? groupId : null;
      const pinned = await getPinnedMessages(user._id, to, groupIdParam);
      console.log("Pinned messages:", pinned);

      const formattedPinned = pinned.map((msg) => ({
        _id: msg._id,
        senderAvatar: msg.senderAvatar || "https://via.placeholder.com/24",
        senderName: msg.senderName || "Người dùng",
        content:
          msg.content ||
          (msg.isImage || msg.fileUrls?.length > 0 ? "[Media]" : ""),
        createdAt: msg.createdAt,
      }));

      setPinnedMessages(formattedPinned);
    } catch (error) {
      console.error("Error fetching pinned messages:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải tin nhắn ghim.");
    }
  };

  useEffect(() => {
    const fetchGroupAndUsers = async () => {
      try {
        if (isGroupChat && groupId) {
          console.log("Fetching group members for groupId:", groupId);
          const [groupData, groupDetails] = await Promise.all([
            getMembersInGroup(groupId),
            getGroupById(groupId),
          ]);
          console.log("Group members data:", groupData);
          console.log("Group details:", groupDetails);

          const fetchedUsers = groupData.members || [];
          console.log("Group members:", fetchedUsers);

          setOtherUsers(fetchedUsers);

          const birthdayList = fetchedUsers.filter((user) =>
            isBirthdayToday(user.birthDate)
          );
          console.log("Birthday list:", birthdayList);
          setBirthdayFriends(birthdayList);

          setGroupInfo({
            groupName: groupDetails.groupName || "Nhóm",
            avatar: groupDetails.avatar || null,
            groupMembers: fetchedUsers.map((u) => u._id),
          });

          fetchPinnedMessages();
        } else if (otherUserIds && otherUserIds.length > 0) {
          console.log("Fetching other users:", otherUserIds);
          const fetchedUsers = await Promise.all(
            otherUserIds.map((id) => getUserById(id))
          );
          console.log("Fetched users for 1-1 chat:", fetchedUsers);

          setOtherUsers(fetchedUsers);

          const birthdayList = fetchedUsers.filter((user) =>
            isBirthdayToday(user.birthDate)
          );
          console.log("Birthday list:", birthdayList);
          setBirthdayFriends(birthdayList);

          fetchPinnedMessages();
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin nhóm hoặc người dùng:", error);
        Alert.alert("Lỗi", "Không thể tải thông tin nhóm hoặc người dùng.");
      }
    };

    fetchGroupAndUsers();
  }, [groupId, otherUserIds, isGroupChat, user._id]);

  const handleSendBirthdayMessage = async (friendId, friendName, senderId) => {
    try {
      const content = `@${friendName} Chúc mừng sinh nhật cậu nhé! 🎉`;
      if (isGroupChat) {
        await sendMediaMessage(
          senderId,
          null,
          groupId,
          [],
          content,
          null,
          null
        );
      } else {
        await sendMediaMessage(
          senderId,
          friendId,
          null,
          [],
          content,
          null,
          null
        );
      }
      fetchMessages();
    } catch (error) {
      console.error("Error sending birthday message:", error);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn chúc mừng");
    }
  };

  const fetchMessages = async () => {
    try {
      let rawMessages = [];
      if (isGroupChat) {
        console.log("Fetching group messages for groupId:", groupId);
        rawMessages = await getMessages(user._id, "", groupId);
      } else {
        const otherId = otherUserIds?.length === 1 ? otherUserIds[0] : null;
        if (!otherId) {
          console.warn("Không có otherId hợp lệ cho chat cá nhân");
          return;
        }
        console.log("Fetching messages for otherId:", otherId);
        rawMessages = await getMessages(user._id, otherId);
      }

      const formatMessages = (rawMessages) => {
        return rawMessages.map((msg) => {
          const files = msg.fileUrls || [];
          const types = msg.fileTypes || [];
          const sender = otherUsers.find((u) => u._id === msg.sender) || {
            _id: msg.sender,
            fullName: msg.fullName || "Người dùng",
            avatar: msg.avatar || "https://via.placeholder.com/24",
          };
          return {
            _id: msg._id,
            text: msg.recalled ? "Tin nhắn đã bị thu hồi" : msg.message || "",
            createdAt: new Date(msg.createdAt),
            user: {
              _id: msg.fromSelf ? user._id : sender._id,
              name: msg.fromSelf ? user.fullName : sender.fullName,
              avatar: msg.fromSelf ? user.avatar : sender.avatar,
            },
            files: files.map((url, i) => ({ url, type: types[i] || "" })),
            recalled: msg.recalled || false,
            reactions: msg.reactions || [],
            pinned: msg.pinned || false,
            replyTo: msg.replyTo
              ? {
                  _id: msg.replyTo._id,
                  text: msg.replyTo.text || "",
                  user: {
                    _id: msg.replyTo.user?._id,
                    name: msg.replyTo.user?.fullName || "Người dùng",
                  },
                  files:
                    msg.replyTo.fileUrls?.map((url, i) => ({
                      url,
                      type: msg.replyTo.fileTypes?.[i] || "",
                    })) || [],
                }
              : null,
            poll: msg.poll
              ? {
                  question: msg.poll.question,
                  options: msg.poll.options.map((opt) => ({
                    text: opt.text,
                    votes: opt.votes || [],
                  })),
                  isActive: msg.poll.isActive,
                }
              : null,
          };
        });
      };

      const formattedMessages = formatMessages(rawMessages);
      const sortedMessages = formattedMessages.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setMessages(sortedMessages);
    } catch (error) {
      console.error("Lỗi lấy tin nhắn:", error);
    }
  };

  useEffect(() => {
  if (user && (otherUsers.length > 0 || isGroupChat)) {
    fetchMessages();

    const handleMessageReceive = (message) => {
      console.log("Nhận tin nhắn:", message);
      if (isGroupChat && message.groupId === groupId) {
        if (message.type === "poll-created" || message.type === "poll-updated") {
          fetchMessages();
        } else {
          fetchMessages();
        }
      } else if (!isGroupChat && message.from === otherUserIds[0]) {
        fetchMessages();
      }
    };

    const handleMessageRecalled = async ({ messageId, groupId: recalledGroupId }) => {
      console.log("Tin nhắn thu hồi:", messageId);
      try {
        if (isGroupChat && recalledGroupId === groupId) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg._id === messageId
                ? {
                    ...msg,
                    text: t("message.recalled"),
                    recalled: true,
                    files: [],
                    poll: null,
                  }
                : msg
            )
          );
          const isPinned = pinnedMessages.some((msg) => msg._id === messageId);
          if (isPinned) {
            await unpinMessage(messageId, user._id);
          }
          setPinnedMessages((prevPinned) =>
            prevPinned.filter((msg) => msg._id !== messageId)
          );
          await fetchPinnedMessages();
        } else if (!isGroupChat && otherUserIds.includes(message.from)) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg._id === messageId
                ? {
                    ...msg,
                    text: t("message.recalled"),
                    recalled: true,
                    files: [],
                    poll: null,
                  }
                : msg
            )
          );
          const isPinned = pinnedMessages.some((msg) => msg._id === messageId);
          if (isPinned) {
            await unpinMessage(messageId, user._id);
          }
          setPinnedMessages((prevPinned) =>
            prevPinned.filter((msg) => msg._id !== messageId)
          );
          await fetchPinnedMessages();
        }
      } catch (error) {
        console.error("Lỗi xử lý thu hồi tin nhắn:", error);
        Alert.alert("Lỗi", "Không thể xử lý thu hồi tin nhắn.");
      }
    };

    const handleMessageDeleted = ({ messageId, groupId: deletedGroupId }) => {
      console.log("Tin nhắn xóa:", messageId);
      if (isGroupChat && deletedGroupId === groupId) {
        setMessages((prevMessages) =>
          prevMessages.filter((m) => m._id !== messageId)
        );
        setPinnedMessages((prev) => prev.filter((m) => m._id !== messageId));
      } else if (!isGroupChat && otherUserIds.includes(message.from)) {
        setMessages((prevMessages) =>
          prevMessages.filter((m) => m._id !== messageId)
        );
        setPinnedMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
    };

    const handlePinMessage = ({ messageId }) => {
      console.log("Tin nhắn ghim:", messageId);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId ? { ...msg, pinned: true } : msg
        )
      );
      fetchPinnedMessages();
    };

    const handleUnpinMessage = ({ messageId }) => {
      console.log("Tin nhắn bỏ ghim:", messageId);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId ? { ...msg, pinned: false } : msg
        )
      );
      fetchPinnedMessages();
    };

    // Thêm hàm xử lý phản hồi emoji
    const handleMessageReacted = ({ messageId, userId, emoji, groupId: reactedGroupId }) => {
      console.log("Tin nhắn được react:", { messageId, userId, emoji });
      if (isGroupChat && reactedGroupId === groupId) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId
              ? {
                  ...msg,
                  reactions: [
                    ...(msg.reactions || []).filter((r) => r.userId !== userId),
                    { userId, emoji },
                  ],
                }
              : msg
          )
        );
      } else if (!isGroupChat && (otherUserIds.includes(userId) || userId === user._id)) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId
              ? {
                  ...msg,
                  reactions: [
                    ...(msg.reactions || []).filter((r) => r.userId !== userId),
                    { userId, emoji },
                  ],
                }
              : msg
          )
        );
      }
    };

    socket.on("msg-receive", handleMessageReceive);
    socket.on("group-msg-receive", handleMessageReceive);
    socket.on("msg-recall", handleMessageRecalled);
    socket.on("group-msg-recall", handleMessageRecalled);
    socket.on("msg-delete", handleMessageDeleted);
    socket.on("group-msg-delete", handleMessageDeleted);
    socket.on("pin-message", handlePinMessage);
    socket.on("unpin-message", handleUnpinMessage);
    socket.on("msg-react", handleMessageReacted);
    socket.on("group-msg-react", handleMessageReacted);

    return () => {
      socket.off("msg-receive", handleMessageReceive);
      socket.off("group-msg-receive", handleMessageReceive);
      socket.off("msg-recall", handleMessageRecalled);
      socket.off("group-msg-recall", handleMessageRecalled);
      socket.off("msg-delete", handleMessageDeleted);
      socket.off("group-msg-delete", handleMessageDeleted);
      socket.off("pin-message", handlePinMessage);
      socket.off("unpin-message", handleUnpinMessage);
      socket.off("msg-react", handleMessageReacted);
      socket.off("group-msg-react", handleMessageReacted);
    };
  }
}, [user, otherUsers, isGroupChat, groupId]);

  const getMimeTypeFromUri = (uri) => {
    const extension = uri.split(".").pop().toLowerCase();
    const mimeMap = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      heic: "image/heic",
      mp4: "video/mp4",
      mov: "video/quicktime",
    };
    return mimeMap[extension] || "application/octet-stream";
  };

  const handleMediaPick = async (type) => {
    let result;

    if (type === "camera") {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
        allowsMultipleSelection: false,
      });
    } else if (type === "video") {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
        videoMaxDuration: 60,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });
    }

    if (!result.canceled) {
      const selected = result.assets.map((asset) => {
        const uri = asset.uri;
        const name = asset.fileName || uri.split("/").pop();
        const type = getMimeTypeFromUri(uri);
        const size = asset.fileSize || 0;

        return { uri, name, type, size };
      });

      setPendingFiles((prev) => [...prev, ...selected]);
      setIsWidgetBarVisible(false);
    }
  };

  const handleFilePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true });
    if (!result.canceled) {
      const selected = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || "application/octet-stream",
      }));
      setPendingFiles((prev) => [...prev, ...selected]);
      setIsWidgetBarVisible(false);
    }
  };

  const handleLongPress = (message, recalled) => {
    if (!message || recalled) return;
    setSelectedMessageForAction(message);
    setMessageActionSheetVisible(true);
  };

  const onSend = async (newMessages = []) => {
    if (isSending) return;
    try {
      setIsSending(true);
      const textToSend = newMessages[0]?.text.trim() || "";
      const replyToId = replyingTo ? replyingTo._id : null;

      if (pendingFiles.some((file) => !file.uri || !file.type)) {
        throw new Error("File thiếu thuộc tính cần thiết");
      }

      if (isGroupChat) {
        console.log("Sending group message:", {
          text: textToSend,
          files: pendingFiles,
        });
        await sendMediaMessage(
          user._id,
          null,
          groupId,
          pendingFiles,
          textToSend,
          null,
          replyToId
        );
      } else {
        const to = otherUserIds[0];
        console.log("Sending personal message to:", to, {
          text: textToSend,
          files: pendingFiles,
        });
        await sendMediaMessage(
          user._id,
          to,
          null,
          pendingFiles,
          textToSend,
          null,
          replyToId
        );
      }

      setPendingFiles([]);
      setReplyingTo(null);
      fetchMessages();

      setTimeout(() => {
        chatRef.current?.scrollToBottom();
      }, 100);
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể gửi tin nhắn vào lúc này."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleForward = async (userIds) => {
    if (!messageToForward) return;

    const text = messageToForward.recalled ? "" : messageToForward.text || "";
    const filesToForward = messageToForward.files || [];

    for (const userId of userIds) {
      try {
        await sendMediaMessage(
          user._id,
          userId,
          null,
          filesToForward.map((f) => ({ uri: f.url, type: f.type })),
          text,
          null,
          messageToForward.replyTo ? messageToForward.replyTo._id : null
        );
      } catch (error) {
        console.error("Lỗi chuyển tiếp tin nhắn:", error);
      }
    }

    setMessageToForward(null);
    setForwardModalVisible(false);
  };

  const handleGifPick = async () => {
    setIsGifModalVisible(true);
  };

  const renderPinnedMessages = () => {
    if (pinnedMessages.length === 0) return null;

    // Lọc thêm tin nhắn bị thu hồi trước khi render
    const validPinnedMessages = pinnedMessages.filter((msg) => !msg.recalled);

    if (validPinnedMessages.length === 0) return null;

    return (
      <View style={styles.pinnedMessagesContainer}>
        <Text style={styles.pinnedMessagesTitle}>Tin nhắn đã ghim</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {validPinnedMessages.map((msg) => (
            <TouchableOpacity
              key={msg._id}
              style={styles.pinnedMessageCard}
              onPress={() => {
                const index = messages.findIndex((m) => m._id === msg._id);
                if (index !== -1) {
                  flatListRef.current?.scrollToIndex({
                    index,
                    animated: true,
                    viewPosition: 0.5,
                  });
                } else {
                  Alert.alert(
                    "Thông báo",
                    "Tin nhắn không còn trong cuộc trò chuyện."
                  );
                }
              }}
            >
              <ExpoImage
                source={{ uri: msg.senderAvatar }}
                style={styles.pinnedMessageAvatar}
              />
              <View style={styles.pinnedMessageContent}>
                <View style={styles.pinnedMessageHeader}>
                  <Ionicons name="pin" size={14} color="#FFD700" />
                  <Text style={styles.pinnedMessageSender} numberOfLines={1}>
                    {msg.senderName}
                  </Text>
                </View>
                <View style={styles.pinnedMessageTextContainer}>
                  {msg.content === "[Media]" && (
                    <Ionicons
                      name="image-outline"
                      size={14}
                      color="#2C3E50"
                      style={styles.mediaIcon}
                    />
                  )}
                  <Text style={styles.pinnedMessageText} numberOfLines={1}>
                    {msg.content}
                  </Text>
                </View>
                <Text style={styles.pinnedMessageTime}>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  const flatListRef = useRef(null);
  const renderInputToolbar = (props) => {
    const renderReplyPreview = () => {
      if (!replyingTo) return null;

      return (
        <View style={styles.replyPreview}>
          <Text
            style={{
              fontWeight: "600",
              color: "#2C3E50",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            Đang trả lời: {replyingTo.user?.name || "Người dùng"}
          </Text>
          {(replyingTo.recalled || replyingTo.text?.trim()) && (
            <Text
              style={{
                color: "#2C3E50",
                fontSize: 14,
                fontStyle: replyingTo.recalled ? "italic" : "normal",
              }}
            >
              {replyingTo.recalled
                ? "Tin nhắn đã được thu hồi"
                : replyingTo.text}
            </Text>
          )}
          <TouchableOpacity
            onPress={() => setReplyingTo(null)}
            style={{ position: "absolute", top: 6, right: 6 }}
          >
            <Ionicons name="close-circle-outline" size={18} color="#7F8C8D" />
          </TouchableOpacity>
        </View>
      );
    };

    const toggleWidgetBar = () => {
      setIsWidgetBarVisible((prev) => !prev);
    };

    const handleCreatePoll = () => {
      setIsWidgetBarVisible(false);
      navigation.navigate("CreatePoll", { groupId });
    };

    return (
      <View style={styles.inputContainer}>
        {renderReplyPreview()}
        {birthdayFriends.length > 0 &&
          birthdayFriends.map((friend) => (
            <BirthdayBanner
              key={friend._id}
              friend={friend}
              userId={user._id}
              onSendBirthdayMessage={handleSendBirthdayMessage}
            />
          ))}
        {isWidgetBarVisible && (
          <View style={styles.widgetBar}>
            <TouchableOpacity
              style={styles.widgetButton}
              onPress={() => handleMediaPick("camera")}
            >
              <Ionicons name="camera-outline" size={24} color="#2C3E50" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.widgetButton}
              onPress={() => handleMediaPick("gallery")}
            >
              <Ionicons name="image-outline" size={24} color="#2C3E50" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.widgetButton}
              onPress={() => handleMediaPick("video")}
            >
              <Ionicons name="videocam-outline" size={24} color="#2C3E50" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.widgetButton}
              onPress={handleFilePick}
            >
              <Ionicons
                name="document-attach-outline"
                size={24}
                color="#2C3E50"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.widgetButton}
              onPress={handleGifPick}
            >
              <Ionicons name="happy-outline" size={24} color="#2C3E50" />
            </TouchableOpacity>
            {isGroupChat && (
              <TouchableOpacity
                style={styles.widgetButton}
                onPress={handleCreatePoll}
              >
                <Ionicons name="bar-chart-outline" size={24} color="#2C3E50" />
              </TouchableOpacity>
            )}
          </View>
        )}
        <View style={styles.inputToolbar}>
          <TouchableOpacity style={styles.plusButton} onPress={toggleWidgetBar}>
            <Ionicons
              name={
                isWidgetBarVisible
                  ? "close-circle-outline"
                  : "add-circle-outline"
              }
              size={28}
              color="#2C3E50"
            />
          </TouchableOpacity>
          <InputToolbar
            {...props}
            containerStyle={styles.inputTextContainer}
            primaryStyle={{ flex: 1 }}
          />
        </View>
        {pendingFiles.length > 0 && (
          <View style={styles.filePreviewContainer}>
            {pendingFiles.map((file, index) => (
              <View key={index} style={styles.filePreviewItem}>
                {file.type.startsWith("image/") ||
                file.type.startsWith("video/") ? (
                  <Image
                    source={{ uri: file.uri }}
                    style={styles.filePreviewImage}
                  />
                ) : (
                  <Ionicons
                    name={getFileIcon(file.uri)}
                    size={24}
                    color="#2C3E50"
                  />
                )}
                <TouchableOpacity
                  onPress={() => {
                    const newFiles = [...pendingFiles];
                    newFiles.splice(index, 1);
                    setPendingFiles(newFiles);
                  }}
                  style={styles.removeFileButton}
                >
                  <Ionicons name="close-circle" size={16} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };
  const SYSTEM_USER_ID = "68356b60184881aa5558a25a";

  const renderBubble = (props) => {
    const currentRenderMessage = props.currentMessage;
    const previousMessage = props.previousMessage;
    const BubbleWrapper =
      Platform.OS === "android" ? TouchableNativeFeedback : TouchableOpacity;
    const messageReactions = currentRenderMessage?.reactions || [];
    const aggregatedReactions = messageReactions.reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {});
    const isMine = currentRenderMessage?.user?._id === user._id;
    const isSystem = currentRenderMessage?.user?._id === SYSTEM_USER_ID;
    const isRecalled = currentRenderMessage?.recalled;
    const isReply = !!currentRenderMessage?.replyTo;
    const showAvatar =
      isGroupChat &&
      !isMine &&
      !isRecalled &&
      (!previousMessage ||
        previousMessage.user?._id !== currentRenderMessage.user?._id ||
        previousMessage.recalled);
    // Kiểm tra xem tin nhắn hiện tại có phải là tin nhắn được chọn trong tìm kiếm
    const isSelected =
      searchResults.length > 0 &&
      currentResultIndex >= 0 &&
      searchResults[currentResultIndex]?.msg._id === currentRenderMessage._id;

    const renderReplyTo = (replyTo) => {
      if (!replyTo) return null;

      const isMineReply = replyTo.user?._id === user._id;
      console.log("isSystem: ", isSystem);

      return (
        <View
          style={{
            backgroundColor: isMineReply ? "#E8ECEF" : "#D8D8D8",
            borderRadius: 12,
            padding: 8,
            marginBottom: 8,
            borderLeftWidth: 4,
            borderLeftColor: isMineReply ? "#4A90E2" : "#9B59B6",
            opacity: 0.9,
          }}
        >
          <Text
            style={{
              fontWeight: "600",
              fontSize: 12,
              marginBottom: 4,
              color: "#2C3E50",
            }}
          >
            {replyTo.user?.name || "Người dùng"}
          </Text>
          {(replyTo.recalled || replyTo.text?.trim()) && (
            <Text
              style={{
                color: "#2C3E50",
                fontSize: 14,
                fontStyle: replyTo.recalled ? "italic" : "normal",
              }}
            >
              {replyTo.recalled ? "Tin nhắn đã được thu hồi" : replyTo.text}
            </Text>
          )}
          {!replyTo.recalled && replyTo.files?.length > 0 && (
            <View style={{ marginTop: 5 }}>
              {props.renderCustomView({ ...props, currentMessage: replyTo })}
            </View>
          )}
        </View>
      );
    };

    const renderPoll = (poll) => {
      if (!poll) return null;

      const handleVote = async (optionIndex) => {
        try {
          await votePoll(currentRenderMessage._id, user._id, optionIndex);
          fetchMessages();
        } catch (error) {
          console.error("Error voting poll:", error);
          Alert.alert("Lỗi", error.message || "Không thể bỏ phiếu.");
        }
      };

      const handleRemoveVote = async (optionIndex) => {
        try {
          await removeVote(currentRenderMessage._id, user._id, optionIndex);
          fetchMessages();
        } catch (error) {
          console.error("Error removing vote:", error);
          Alert.alert("Lỗi", error.message || "Không thể xóa phiếu bầu.");
        }
      };

      return (
        <View style={styles.pollContainer}>
          <Text style={styles.pollQuestion}>{poll.question}</Text>
          {poll.options.map((option, index) => {
            const hasVoted = option.votes.includes(user._id);
            const voteCount = option.votes.length;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pollOption,
                  hasVoted ? styles.pollOptionVoted : null,
                ]}
                onPress={() =>
                  poll.isActive
                    ? hasVoted
                      ? handleRemoveVote(index)
                      : handleVote(index)
                    : null
                }
                disabled={!poll.isActive}
              >
                <Text
                  style={[
                    styles.pollOptionText,
                    !poll.isActive ? styles.pollOptionDisabled : null,
                  ]}
                >
                  {option.text} ({voteCount})
                </Text>
              </TouchableOpacity>
            );
          })}
          {!poll.isActive && (
            <Text style={styles.pollClosedText}>Khảo sát đã đóng</Text>
          )}
        </View>
      );
    };
    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessageWrapper}>
            <Text style={styles.systemMessageText}>
              {currentRenderMessage.text}
            </Text>
            <Text style={styles.systemMessageTime}>
              {new Date(currentRenderMessage.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>
      );
    } else
      return (
        <BubbleWrapper
          onLongPress={() => {
            handleLongPress(props.currentMessage, isRecalled);
          }}
          delayLongPress={150}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: isMine ? "flex-end" : "flex-start",
              marginVertical: 6,
              marginHorizontal: 12,
            }}
          >
            <View
              style={[
                styles.bubble,
                {
                  maxWidth: percentWidth + "%",
                  backgroundColor: isMine ? "#3797F0" : "#e0e0e0",
                  opacity: isRecalled ? 0.7 : 1,
                  borderWidth: isSelected
                    ? 2
                    : currentRenderMessage.pinned
                    ? 2
                    : 0,
                  borderColor: isSelected
                    ? "#FFD700"
                    : currentRenderMessage.pinned
                    ? "#FFD700"
                    : "transparent",
                },
                isMine ? styles.bubbleRight : styles.bubbleLeft,
              ]}
            >
              {isReply && renderReplyTo(currentRenderMessage.replyTo)}
              {!(currentRenderMessage.text?.trim() === "" && !isRecalled) && (
                <Text
                  style={{
                    color: isRecalled
                      ? "#FFFFFF"
                      : isMine
                      ? "#FFFFFF"
                      : "#000000",
                    fontSize: 16,
                    fontStyle: isRecalled ? "italic" : "normal",
                  }}
                >
                  {isRecalled
                    ? "Tin nhắn đã được thu hồi"
                    : currentRenderMessage.text}
                </Text>
              )}
              {!isRecalled && currentRenderMessage.files?.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  {props.renderCustomView(props)}
                </View>
              )}
              {!isRecalled && currentRenderMessage.poll && (
                <View style={{ marginTop: 8 }}>
                  {renderPoll(currentRenderMessage.poll)}
                </View>
              )}
              <Text
                style={{
                  fontSize: 10,
                  color: "#ffffff",
                  textAlign: isMine ? "right" : "left",
                  marginTop: 4,
                }}
              >
                {new Date(currentRenderMessage.createdAt).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </Text>
              {isGroupChat && !isMine && (
                <Text
                  style={{
                    fontSize: 12,
                    color: "#ffffff",
                    textAlign: "left",
                    marginTop: 2,
                  }}
                >
                  {currentRenderMessage.user.name}
                </Text>
              )}
              {!isRecalled && Object.keys(aggregatedReactions).length > 0 && (
                <TouchableOpacity
                  style={styles.reactionsContainer}
                  onPress={() => {
                    setSelectedMessageForAction(currentRenderMessage);
                    setSelectedMessageReactions(currentRenderMessage.reactions);
                    setReactionModalVisible(true);
                  }}
                >
                  {Object.entries(aggregatedReactions).map(([emoji, count]) => (
                    <View key={emoji} style={styles.reactionItem}>
                      <Text style={styles.reactionEmoji}>{emoji}</Text>
                      {count > 1 && (
                        <Text style={styles.reactionCount}>{count}</Text>
                      )}
                    </View>
                  ))}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </BubbleWrapper>
      );
  };

  const getFileIcon = (uri) => {
    if (uri.endsWith(".pdf")) return "document-text-outline";
    if (uri.endsWith(".doc") || uri.endsWith(".docx"))
      return "document-outline";
    if (uri.endsWith(".xls") || uri.endsWith(".xlsx")) return "grid-outline";
    return "document-attach-outline";
  };

  const renderCustomView = ({ currentMessage }) => {
    if (!currentMessage.files || currentMessage.files.length === 0) return null;

    const mediaFiles = currentMessage.files.filter(
      (f) =>
        (f.type.startsWith("image/") && f.type !== "image/gif") ||
        f.type.startsWith("video/")
    );
    const gifFiles = currentMessage.files.filter((f) => f.type === "image/gif");
    const documentFiles = currentMessage.files.filter(
      (f) => !f.type.startsWith("image/") && !f.type.startsWith("video/")
    );

    return (
      <View style={{ padding: 8 }}>
        {mediaFiles.length > 0 && (
          <View style={styles.mediaContainer}>
            {mediaFiles.map((file, index) => (
              <View key={index} style={styles.mediaCard}>
                {file.type.startsWith("image/") ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedImageIndex(index);
                      setImageViewerData(
                        mediaFiles
                          .filter((f) => f.type.startsWith("image/"))
                          .map((f) => ({ uri: f.url }))
                      );
                      setImageViewerVisible(true);
                    }}
                  >
                    <ExpoImage
                      source={{ uri: file.url }}
                      style={styles.mediaImage}
                    />
                  </TouchableOpacity>
                ) : (
                  <Video
                    source={{ uri: file.url }}
                    style={styles.mediaImage}
                    useNativeControls
                    resizeMode="cover"
                    isMuted={true}
                    shouldPlay={false}
                    onError={(error) => console.error("Lỗi tải video:", error)}
                  />
                )}
              </View>
            ))}
          </View>
        )}
        {gifFiles.length > 0 && (
          <View style={styles.mediaContainer}>
            {gifFiles.map((file, index) => (
              <TouchableOpacity
                key={index}
                style={styles.mediaCard}
                onPress={() => {
                  setSelectedImageIndex(index);
                  setImageViewerData(gifFiles.map((f) => ({ uri: f.url })));
                  setImageViewerVisible(true);
                }}
              >
                <ExpoImage
                  source={{ uri: file.url }}
                  style={styles.mediaImage}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
        {documentFiles.length > 0 && (
          <View style={styles.mediaContainer}>
            {documentFiles.map((file, index) => (
              <TouchableOpacity
                key={index}
                style={styles.mediaCard}
                onPress={() => Linking.openURL(file.url)}
              >
                <Ionicons
                  name={getFileIcon(file.url)}
                  size={24}
                  color="#2C3E50"
                />
                <Text numberOfLines={1} style={styles.mediaText}>
                  {file.url.split("/").pop()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderSend = (props) => {
    const { text, user, onSend } = props;
    const shouldSend = text.trim().length > 0 || pendingFiles.length > 0;

    return (
      <TouchableOpacity
        style={styles.sendButton}
        onPress={() => {
          if (shouldSend && !isSending) {
            const message = {
              _id: Date.now().toString(),
              text: text.trim(),
              createdAt: new Date(),
              user: {
                _id: user._id,
                avatar: user.avatar,
              },
            };
            onSend([message], true);
          }
        }}
        disabled={isSending}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons
            name={isSending ? "refresh" : "paper-plane"}
            size={28}
            color={shouldSend && !isSending ? "#3797F0" : "#7F8C8D"}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {customHeader}
      {renderPinnedMessages()}
      {renderSearchBar()}
      <CommonPrimaryContainer
        disableDefaultStyle
        style={{
          flex: 1,
          position: "relative",
        }}
      >
        <SearchResultsModal />
        <ForwardModal
          visible={forwardModalVisible}
          onClose={() => setForwardModalVisible(false)}
          onConfirm={(selectedUserIds) => handleForward(selectedUserIds)}
          messageToForward={messageToForward}
        />
        <GifViewerModal
          images={imageViewerData}
          imageIndex={selectedImageIndex}
          visible={imageViewerVisible}
          onRequestClose={() => setImageViewerVisible(false)}
        />
        <GifModal
          isVisible={isGifModalVisible}
          onClose={() => setIsGifModalVisible(false)}
          onGifSelect={(gif) => {
            setIsGifModalVisible(false);
            if (gif) {
              setPendingFiles((prev) => [
                ...prev,
                {
                  uri: gif.images.fixed_height.url,
                  name: `gif-${Date.now()}.gif`,
                  type: "image/gif",
                  size: 0,
                },
              ]);
            }
          }}
        />
        <MessageActionSheet
  isVisible={messageActionSheetVisible}
  onClose={() => setMessageActionSheetVisible(false)}
  options={[
    selectedMessageForAction?.user?._id === user._id
      ? "↩️ Thu hồi"
      : null,
    "🗑️ Xóa phía tôi",
    "📤 Chuyển tiếp",
    "💬 Trả lời",
    selectedMessageForAction?.pinned ? "📌 Bỏ ghim" : "📌 Ghim",
  ].filter(Boolean)}
  onSelect={async (option, msg) => {
    if (option === "↩️ Thu hồi") {
      try {
        await recallMessage(msg._id);
        const isPinned = pinnedMessages.some((m) => m._id === msg._id);
        if (isPinned) {
          await unpinMessage(msg._id, user._id);
        }
        setMessages((prevMessages) =>
          prevMessages.map((m) =>
            m._id === msg._id
              ? {
                  ...m,
                  text: t("message.recalled"),
                  recalled: true,
                  files: [],
                  poll: null,
                }
              : m
          )
        );
        setPinnedMessages((prevPinned) =>
          prevPinned.filter((m) => m._id !== msg._id)
        );
        await fetchPinnedMessages();
      } catch (error) {
        console.error("Lỗi thu hồi tin nhắn:", error);
        Alert.alert("Lỗi", "Không thể thu hồi tin nhắn.");
      }
    } else if (option === "🗑️ Xóa phía tôi") {
      try {
        await deleteMessageForMe(msg._id, user._id);
        setMessages((prevMessages) =>
          prevMessages.filter((m) => m._id !== msg._id)
        );
        setPinnedMessages((prevPinned) =>
          prevPinned.filter((m) => m._id !== msg._id)
        );
      } catch (error) {
        Alert.alert("Lỗi", "Không thể xóa tin nhắn vào lúc này.");
      }
    } else if (option === "📤 Chuyển tiếp") {
      setMessageToForward(msg);
      setForwardModalVisible(true);
    } else if (option === "💬 Trả lời") {
      setReplyingTo(msg);
    } else if (option === "📌 Ghim") {
      try {
        await pinMessage(msg._id, user._id);
        setMessages((prevMessages) =>
          prevMessages.map((m) =>
            m._id === msg._id ? { ...m, pinned: true } : m
          )
        );
        await fetchPinnedMessages();
      } catch (error) {
        Alert.alert("Lỗi", error.msg || "Không thể ghim tin nhắn.");
      }
    } else if (option === "📌 Bỏ ghim") {
      try {
        await unpinMessage(msg._id, user._id);
        setMessages((prevMessages) =>
          prevMessages.map((m) =>
            m._id === msg._id ? { ...m, pinned: false } : m
          )
        );
        await fetchPinnedMessages();
      } catch (error) {
        Alert.alert("Lỗi", error.msg || "Không thể bỏ ghim tin nhắn.");
      }
    }
  }}
  message={selectedMessageForAction}
  emojiOptions={emojiOptions}
  onEmojiSelect={async (emoji, msg) => {
    try {
      await reactToMessage(msg._id, user._id, emoji);
      // Cập nhật trạng thái messages cục bộ
      setMessages((prevMessages) =>
        prevMessages.map((m) =>
          m._id === msg._id
            ? {
                ...m,
                reactions: [
                  ...(m.reactions || []).filter((r) => r.userId !== user._id),
                  { userId: user._id, emoji },
                ],
              }
            : m
        )
      );
    } catch (error) {
      console.error("Lỗi react tin nhắn:", error);
      Alert.alert("Lỗi", "Không thể thêm phản hồi emoji.");
    }
  }}
/>
        <ReactionModal
          isVisible={reactionModalVisible}
          onClose={() => setReactionModalVisible(false)}
          currentMessage={selectedMessageForAction}
          reactions={selectedMessageReactions}
          currentUser={user}
          onUnreact={async (messageId) => {
            await unreactToMessage(messageId, user._id);
            fetchMessages();
          }}
        />
        {!modalVisible && (
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => {
              Keyboard.dismiss();
            }}
            activeOpacity={1}
          >
            <GiftedChat
              ref={chatRef}
              listViewProps={{
                ref: flatListRef,
                onScrollToIndexFailed: (info) => {
                  console.warn("Scroll to index failed:", info);
                  const wait = new Promise((resolve) =>
                    setTimeout(resolve, 100)
                  );
                  wait.then(() => {
                    flatListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: true,
                      viewPosition: 0.5,
                    });
                  });
                },
              }}
              renderInputToolbar={renderInputToolbar}
              renderBubble={renderBubble}
              messages={messages}
              onSend={(messages) => onSend(messages)}
              user={{ _id: user._id, avatar: user.avatar }}
              placeholder={t("message.placeholder")}
              alwaysShowSend
              renderSend={renderSend}
              renderCustomView={renderCustomView}
              showUserAvatar={true}
              isAnimated
              forceGetKeyboardHeight
            />
          </TouchableOpacity>
        )}
      </CommonPrimaryContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  bubble: {
    padding: 12,
    borderRadius: 20,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: Dimensions.get("window").width * 0.75, // Giới hạn 75% chiều rộng màn hình
    flexShrink: 1, // Cho phép bubble co lại nếu nội dung dài
  },
  bubbleLeft: {
    marginRight: 100,
    // marginLeft: 12, // Thêm margin trái để căn chỉnh đẹp
  },
  bubbleRight: {
    marginLeft: 100,
    // marginRight: 12, // Thêm margin phải để căn chỉnh đẹp
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  inputContainer: {
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
    marginHorizontal: 10,
    marginBottom: "5%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 0,
  },
  inputToolbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputTextContainer: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#afacac",
    flex: 1,
    marginHorizontal: 8,
    borderTopColor: "transparent",
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8ECEF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  widgetBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#ffffff",
    padding: 8,
    borderRadius: 20,
    marginBottom: 5,
  },
  widgetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8ECEF",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    bottom: 7,
  },
  filePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    marginBottom: 4,
  },
  filePreviewItem: {
    position: "relative",
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filePreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeFileButton: {
    position: "absolute",
    top: -8,
    right: -8,
  },
  mediaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  mediaCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    margin: 4,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mediaImage: {
    width: Dimensions.get("window").width * 0.25,
    height: Dimensions.get("window").width * 0.25,
    borderRadius: 4,
  },
  mediaText: {
    fontSize: 12,
    color: "#2C3E50",
    marginTop: 4,
    maxWidth: 80,
  },
  replyPreview: {
    backgroundColor: "#E8ECEF",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    position: "relative",
  },
  reactionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 4,
  },
  reactionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: "#2C3E50",
    marginLeft: 2,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECEF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchResultsModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "90%",
    height: "80%",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
  },
  closeModalButton: {
    padding: 8,
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECEF",
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultSender: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  searchResultText: {
    fontSize: 14,
    color: "#2C3E50",
    marginBottom: 4,
  },
  searchResultTime: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  noResultsText: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    marginTop: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    flex: 1,
  },
  pinnedMessagesContainer: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECEF",
  },
  pinnedMessagesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  pinnedMessageCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    width: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pinnedMessageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  pinnedMessageContent: {
    flex: 1,
  },
  pinnedMessageSender: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2C3E50",
  },
  pinnedMessageText: {
    fontSize: 14,
    color: "#2C3E50",
    marginVertical: 2,
  },
  pinnedMessageTime: {
    fontSize: 10,
    color: "#7F8C8D",
  },
  pinnedMessageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  pinnedMessageTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  mediaIcon: {
    marginRight: 4,
  },
  pollContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  pollQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  pollOption: {
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#E8ECEF",
  },
  pollOptionVoted: {
    backgroundColor: "#D1E7FF",
    borderColor: "#3797F0",
  },
  pollOptionText: {
    fontSize: 14,
    color: "#2C3E50",
  },
  pollOptionDisabled: {
    color: "#7F8C8D",
  },
  pollClosedText: {
    fontSize: 12,
    color: "#E74C3C",
    marginTop: 8,
    fontStyle: "italic",
  },
  searchButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECEF",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E8ECEF",
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
    marginRight: 8,
  },
  searchNavigation: {
    flexDirection: "row",
    alignItems: "center",
  },
  navButton: {
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  resultCount: {
    fontSize: 14,
    color: "#2C3E50",
    marginHorizontal: 8,
  },
  systemMessageContainer: {
    width: "85%",
    alignSelf: "center",
    justifyContent: "center",
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  systemMessageWrapper: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#E8ECEF",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    maxWidth: "80%",
  },
  systemMessageText: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
  },
  systemMessageTime: {
    fontSize: 10,
    color: "#7F8C8D",
    textAlign: "center",
    marginTop: 4,
  },
});

export default ChatScreen;
