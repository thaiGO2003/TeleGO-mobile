import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Text,
  Image,
  ActivityIndicator,
  Alert,
  LogBox,
  TouchableNativeFeedback,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TextInput,
} from "react-native";
LogBox.ignoreLogs([
  "Warning: Text strings must be rendered within a <Text> component.",
]);
import ReactionModal from "../components/ReactionModal"; // Import ReactionModal

import { Image as ExpoImage } from "expo-image"; // Alias to avoid conflict
import { useTranslation } from "react-i18next";
import { Video } from "expo-av";
import { Dimensions } from "react-native";
import * as WebBrowser from "expo-web-browser";
import axios from "axios";
const screenWidth = Dimensions.get("window").width;
import { ZEGO_BASE_URL } from "../../../config";
import {
  sendMediaMessage,
  recallMessage,
  deleteMessageForMe,
  reactToMessage,
  unreactToMessage,
} from "../../../api/services/messageService";
import {
    getGroupById,leaveGroup
} from "../../../api/services/groupService"
import GifModal from "../components/GifModal";

import ForwardModal from "../components/ForwardModal";
import { GiftedChat, Send } from "react-native-gifted-chat";
import { InputToolbar } from "react-native-gifted-chat";
import * as ImagePicker from "expo-image-picker";
import * as VideoPicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useActionSheet } from "@expo/react-native-action-sheet";
import MessageActionSheet from "../components/MessageActionSheet";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../../context/AuthContext";
import { useModal } from "../../../context/ModalContext";
import { getUserById } from "../../../api/services/userService";
import CommonPrimaryContainer from "../../../components/layout/CommonPrimaryContainer";
import socket from "../../../utils/socket";
import ImageView from "react-native-image-viewing";
import { useColor } from "../../../context/ColorContext";
import GifViewerModal from "../components/GifViewerModal";
const GroupChatScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { COLORS } = useColor();
  const [messages, setMessages] = useState([]);
  const { user } = useContext(AuthContext);
  const {groupId, groupName, groupMembers } = route.params;  const percentWidth = 70;
  const [pendingFiles, setPendingFiles] = useState([]);
  const [otherUsers, setOtherUsers] = useState([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageViewerData, setImageViewerData] = useState([]);
  const [ForwardModalVisible, setForwardModalVisible] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const chatRef = useRef(null);
  const [isGifModalVisible, setIsGifModalVisible] = useState(false);
  const { modalVisible, setModalVisible } = useModal();
  const [messageActionSheetVisible, setMessageActionSheetVisible] =
    useState(false);
  const [selectedMessageForAction, setSelectedMessageForAction] =
    useState(null);
  const emojiOptions = ["👍", "❤️", "😆", "😲", "😢", "😡"];
  const [reactionModalVisible, setReactionModalVisible] = useState(false);
  const [selectedMessageReactions, setSelectedMessageReactions] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  useEffect(() => {
    const anyModalOpen =
      ForwardModalVisible ||
      imageViewerVisible ||
      isGifModalVisible ||
      messageActionSheetVisible ||
      reactionModalVisible; // Thêm reactionModalVisible

    setModalVisible(anyModalOpen);
  }, [
    ForwardModalVisible,
    imageViewerVisible,
    isGifModalVisible,
    messageActionSheetVisible,
    reactionModalVisible, // Thêm reactionModalVisible
  ]);
  const renderBubble = (props) => {
    const currentRenderMessage = props.currentMessage;
    const BubbleWrapper =
      Platform.OS === "android" ? TouchableNativeFeedback : TouchableOpacity;
    const messageReactions = currentRenderMessage?.reactions || [];
    const aggregatedReactions = messageReactions.reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {});

    const isMine = currentRenderMessage?.user?._id === user._id;
    const isRecalled = currentRenderMessage?.recalled;
    const isReply = !!currentRenderMessage?.replyTo;

    const renderReplyTo = (replyTo) => {
      if (!replyTo) return null;

      const isMineReply = replyTo.user?._id === user._id;

      return (
        <View
          style={{
            backgroundColor: isMineReply ? COLORS.primary : "#f0f0f0",
            borderRadius: 12,
            padding: 8,
            marginBottom: 8,
            borderWidth: 2,
            borderColor: isMineReply ? "#f0f0f0" : COLORS.primary,
            opacity: 0.92,
          }}
        >
          {/* Tên người gửi */}
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 12,
              marginBottom: 4,
              lineHeight: 20,
              color: isMineReply ? "#fff" : "#000",
            }}
          >
            {replyTo.user?.name || "Người dùng"}{" "}
          </Text>

          {/* Nội dung y chang bubble */}
          {(replyTo.recalled || replyTo.text?.trim()) && (
            <Text
              style={{
                color: isMineReply ? "#fff" : "#000",
                fontSize: 14,
                marginBottom: 6,
                lineHeight: 20,
              }}
            >
              {replyTo.recalled ? "Tin nhắn đã được thu hồi" : replyTo.text}
            </Text>
          )}

          {!replyTo.recalled && replyTo.files?.length > 0 && (
            <View style={{ marginTop: 5 }}>
              {/** tái sử dụng renderCustomView nhưng với message là replyTo */}
              {props.renderCustomView({ ...props, currentMessage: replyTo })}
            </View>
          )}
        </View>
      );
    };

    return (
      <BubbleWrapper
        onLongPress={() => {
          handleLongPress(props.currentMessage, isRecalled);
        }}
        delayLongPress={150}
      >
        <View
          style={[
            props.wrapperStyle,
            {
              backgroundColor: isMine ? COLORS.primary : "#f0f0f0",
              borderColor: "transparent",
              borderRadius: 15,
              padding: 10,
              borderWidth: 3,
              maxWidth: percentWidth + "%",
              lineHeight: 22,
              borderColor: isMine ? "#f0f0f0" : COLORS.primary,
              opacity: isRecalled ? 0.8 : 1,
            },
          ]}
        >
          {isReply && renderReplyTo(currentRenderMessage.replyTo)}

          <Text
            style={{
              marginBottom: 10,
              lineHeight: 22,
              color: isRecalled ? "#888" : isMine ? "#fff" : "#000",
              fontStyle: isRecalled ? "italic" : "normal",
            }}
          >
            {isRecalled
              ? "Tin nhắn đã được thu hồi"
              : currentRenderMessage.text}
          </Text>

          {!isRecalled && currentRenderMessage.files?.length > 0 && (
            <View style={{ marginTop: 5 }}>
              {props.renderCustomView(props)}
            </View>
          )}

          <Text
            style={{
              fontSize: 10,
              color: "black",
            }}
          >
            {props.currentMessage.createdAt.toLocaleString()}
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: "black",
            }}
          >
            {props.currentMessage.user.name}
          </Text>

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
  useEffect(() => {
    const fetchOtherUsers = async () => {
      try {
        const fetchedUsers = await Promise.all(
          otherUserIds.map((id) => getUserById(id))
        );
        setOtherUsers(fetchedUsers);
      } catch (error) {}
    };

    if (otherUserIds && otherUserIds.length > 0) {
      fetchOtherUsers();
    }
  }, [otherUserIds]);
  const fetchMessages = async () => {
    try {

      if (!groupId) {
        return;
      }

      const rawGroupMessages = await getGroup(user._id, otherId);
      const otherUser = otherUsers.find((u) => u._id === otherId);

      const formatMessages = (rawMessages, sender) => {
        return rawMessages.map((msg) => {
          const files = msg.fileUrls || [];
          const types = msg.fileTypes || [];
          return {
            _id: msg._id,
            text: msg.recalled ? "Tin nhắn đã bị thu hồi" : msg.message || "",
            createdAt: new Date(msg.createdAt),
            user: {
              _id: msg.fromSelf ? user._id : sender?._id,
              name: msg.fromSelf ? user.fullName : sender?.fullName,
              avatar: msg.fromSelf ? user.avatar : sender?.avatar,
            },
            files: files.map((url, i) => ({ url, type: types[i] || "" })),
            recalled: msg.recalled || false,
            reactions: msg.reactions || [],
            replyTo: msg.replyTo
              ? {
                  _id: msg.replyTo._id,
                  text: msg.replyTo.text || "",
                  user: {
                    _id: msg.replyTo.user?._id,
                    name: msg.replyTo.user.fullName,
                  },
                  files:
                    msg.replyTo.fileUrls?.map((url, i) => ({
                      url,
                      type: msg.replyTo.fileTypes?.[i] || "",
                    })) || [],
                }
              : null,
          };
        });
      };

      const formattedMessagesWithOther = formatMessages(
        rawMessagesWithOther,
        otherUser
      );

      const allMessages = [...formattedMessagesWithOther].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setMessages(allMessages);
    } catch (error) {}
  };
  useEffect(() => {
    if (user && otherUsers.length > 0) {
      fetchMessages();

      const handleMessageReceive = (message) => {
        fetchMessages();
      };

      const handleMessageRecalled = (recalledMessageId) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === recalledMessageId
              ? {
                  ...msg,
                  text: t("message.recalled"),
                  recalled: true,
                  files: [],
                }
              : msg
          )
        );
      };

      socket.on("msg-receive", handleMessageReceive);
      socket.on("msg-recalled", handleMessageRecalled);

      return () => {
        socket.off("msg-receive", handleMessageReceive);
        socket.off("msg-recalled", handleMessageRecalled);
      };
    }
  }, [user, otherUsers]);

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
    }
  };

  const handleLongPress = (message, recalled) => {
    if (!message || recalled) return;
    setSelectedMessageForAction(message);
    setMessageActionSheetVisible(true);
  };

  const onSend = async (newMessages = []) => {
    try {
      const textToSend = newMessages[0]?.text.trim() || "";
      const to = otherUserIds[0];
      if (pendingFiles.some((file) => !file.uri || !file.type)) {
        throw new Error("File missing required properties");
      }

      const replyToId = replyingTo ? replyingTo._id : null;

      await sendMediaMessage(
        user._id,
        to,
        pendingFiles,
        textToSend,
        null,
        replyToId
      );

      setPendingFiles([]);
      setReplyingTo(null); // Reset trạng thái replying

      fetchMessages();

      setTimeout(() => {
        chatRef.current?.scrollToBottom();
      }, 100);
    } catch (error) {}
  };

  const renderInputToolbar = (props) => {
    const isMineReply = replyingTo?.user?._id === user._id;

    const renderReplyPreview = () => {
      if (!replyingTo) return null;

      return (
        <View
          style={{
            backgroundColor: isMineReply ? COLORS.primary : "#f0f0f0",
            padding: 10,
            borderRadius: 15,
            marginBottom: 8,
            borderWidth: 2,
            lineHeight: 20,
            borderColor: isMineReply ? "#f0f0f0" : COLORS.primary,
            position: "relative",
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              color: isMineReply ? "#fff" : "#000",
              marginBottom: 4,
              lineHeight: 20,
            }}
          >
            Đang trả lời tin nhắn của: {replyingTo.user?.name || "Người dùng"}
          </Text>

          {(replyingTo.recalled || replyingTo.text?.trim()) && (
            <Text
              style={{
                color: isMineReply ? "#fff" : "#000",
                fontSize: 14,
                marginBottom: 6,
                lineHeight: 20,
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
            <Ionicons name="close-circle-outline" size={18} color="gray" />
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <View style={{ marginBottom: 80, paddingHorizontal: 10 }}>
        {renderReplyPreview()}
        {renderObjects()}
        <InputToolbar
          {...props}
          containerStyle={{
            borderTopWidth: 1,
            borderTopColor: "#ccc",
            borderRadius: 40,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        />
      </View>
    );
  };

  const handleVideoCall = () => {
    const ids = [user._id, otherUserIds[0]].sort();
    const roomID = `room-${ids[0]}-${ids[1]}`;
    const videoCallUrl = ZEGO_BASE_URL + `?roomID=${roomID}&userID=${user._id}`;
    WebBrowser.openBrowserAsync(videoCallUrl);
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
          filesToForward.map((f) => ({ uri: f.url, type: f.type })),
          text,
          messageToForward.replyTo ? messageToForward.replyTo._id : null // Chuyển tiếp cả thông tin reply nếu có
        );
      } catch (error) {}
    }

    setMessageToForward(null);
    setForwardModalVisible(false);
  };

  const handleGifPick = async () => {
    setIsGifModalVisible(true);
  };

  const renderObjects = () => {
    return (
      <View>
        <View style={styles}>
          {pendingFiles.length > 0 && (
            <View style={styles.filePreviewRow}>
              {pendingFiles.map((file, index) => (
                <View key={index} style={styles.filePreviewContainer}>
                  {file.type.startsWith("image/") ? (
                    <Image
                      source={{ uri: file.uri }}
                      style={{ width: 50, height: 50 }}
                    />
                  ) : (
                    <Ionicons
                      name={getFileIcon(file.uri)}
                      size={32}
                      color="gray"
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      const newFiles = [...pendingFiles];
                      newFiles.splice(index, 1);
                      setPendingFiles(newFiles);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.widgetContainer}>
          <TouchableOpacity
            style={{ marginLeft: 10, marginBottom: 10 }}
            onPress={() => handleMediaPick("camera")}
          >
            <Ionicons name="camera-outline" size={28} color="gray" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginLeft: 10, marginBottom: 10 }}
            onPress={() => handleMediaPick("video")}
          >
            <Ionicons name="videocam-outline" size={28} color="gray" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginLeft: 10, marginBottom: 10 }}
            onPress={handleMediaPick}
          >
            <Ionicons name="image-outline" size={28} color="gray" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginLeft: 10, marginBottom: 10 }}
            onPress={handleFilePick}
          >
            <Ionicons name="attach-outline" size={28} color="gray" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginLeft: 10, marginBottom: 10 }}
            onPress={handleVideoCall}
          >
            <Ionicons name="videocam" size={28} color="gray" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginLeft: 10, marginBottom: 10 }}
            onPress={() => handleGifPick()}
          >
            <Ionicons name="images-outline" size={28} color="gray" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCustomView = ({ currentMessage }) => {
    if (!currentMessage.files || currentMessage.files.length === 0) return null;

    // 1. Ảnh tĩnh (jpg/png/… nhưng không bao gồm gif)
    const imageFiles = currentMessage.files.filter(
      (f) => f.type.startsWith("image/") && f.type !== "image/gif"
    );

    // 2. Video
    const videoFiles = currentMessage.files.filter((f) =>
      f.type.startsWith("video/")
    );

    // 3. GIF
    const gifFiles = currentMessage.files.filter((f) => f.type === "image/gif");

    // 4. Tài liệu (PDF, Word, Excel, ...)
    const documentFiles = currentMessage.files.filter(
      (f) => !f.type.startsWith("image/") && !f.type.startsWith("video/")
    );

    return (
      <View style={{ padding: 5 }}>
        {imageFiles.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "flex-start",
              width: "100%",
            }}
          >
            {imageFiles.map((file, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedImageIndex(index);
                  setImageViewerData(imageFiles.map((f) => ({ uri: f.url })));
                  setImageViewerVisible(true);
                }}
              >
                <ExpoImage
                  source={{ uri: file.url }}
                  style={{
                    width:
                      imageFiles.length === 1
                        ? screenWidth * 0.8 * (percentWidth / 100)
                        : (screenWidth / 3.5) * (percentWidth / 100),
                    height:
                      imageFiles.length === 1
                        ? ((screenWidth * 0.8 * 9) / 16) * (percentWidth / 100)
                        : (screenWidth / 3.5) * (percentWidth / 100),
                    margin: 4,
                    borderRadius: 8,
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {gifFiles.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "flex-start",
              width: "100%",
            }}
          >
            {gifFiles.map((file, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedImageIndex(index);
                  setImageViewerData(gifFiles.map((f) => ({ uri: f.url })));
                  setImageViewerVisible(true);
                }}
              >
                <ExpoImage
                  source={{ uri: file.url }}
                  style={{
                    width: screenWidth / 3.5,
                    height: screenWidth / 3.5,
                    margin: 4,
                    borderRadius: 8,
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {videoFiles.length > 0 && (
          <View style={{ flexDirection: "row", paddingVertical: 5 }}>
            {videoFiles.map((file, index) => (
              <TouchableOpacity
                key={index}
                style={{ marginRight: 10 }}
                onPress={() => Linking.openURL(file.url)} // Hoặc xử lý phát video khác
              >
                <Ionicons name="play-circle-outline" size={48} color="gray" />
                <Text numberOfLines={1} style={{ maxWidth: 80, fontSize: 10 }}>
                  {file.url.split("/").pop()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {documentFiles.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingVertical: 5,
            }}
          >
            {documentFiles.map((file, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => Linking.openURL(file.url)}
                style={{
                  width: 100,
                  alignItems: "center",
                  margin: 4,
                }}
              >
                <Ionicons name={getFileIcon(file.url)} size={32} color="gray" />
                <Text numberOfLines={1} style={{ maxWidth: 80, fontSize: 10 }}>
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
        style={{
          marginRight: 10,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 10,
        }}
        onPress={() => {
          if (shouldSend) {
            const message = {
              _id: Date.now().toString(),
              text: text.trim(),
              createdAt: new Date(),
              user: {
                _id: user._id,
                avatar: user.avatar,
              },
            };
            onSend([message], true); // Gửi thủ công
          }
        }}
      >
        <Ionicons name="send" size={24} color={COLORS.primary} />
      </TouchableOpacity>
    );
  };

  return (
    <CommonPrimaryContainer
      disableDefaultStyle
      style={{
        flex: 1,
        paddingHorizontal: 10,
      }}
    >
      <ForwardModal
        visible={ForwardModalVisible}
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
        onClose={async () => await setIsGifModalVisible(false)}
        onGifSelect={(gif) => {
          setIsGifModalVisible(false);
          if (gif) {
            setPendingFiles((prev) => [
              ...prev,
              {
                uri: gif.images.fixed_height.url,
                name: "gif.gif", // You might want to generate a more unique name
                type: "image/gif",
                size: 0, // Size might not be readily available
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
          "💬 Trả lời", // Thêm tùy chọn "Trả lời"
        ].filter(Boolean)}
        onSelect={async (option, msg) => {
          if (option === "↩️ Thu hồi") {
            await recallMessage(msg._id);
            setMessages((prevMessages) =>
              prevMessages.map((m) =>
                m._id === msg._id
                  ? {
                      ...m,
                      text: "Tin nhắn thu hồi...",
                      recalled: true,
                      files: [],
                    }
                  : m
              )
            );
          } else if (option === "🗑️ Xóa phía tôi") {
            try {
              await deleteMessageForMe(msg._id, user._id);
              setMessages((prevMessages) =>
                prevMessages.filter((m) => m._id !== msg._id)
              );
            } catch (error) {
              Alert.alert("Lỗi", "Không thể xóa tin nhắn vào lúc này.");
            }
          } else if (option === "📤 Chuyển tiếp") {
            setMessageToForward(msg);
            setForwardModalVisible(true);
          } else if (option === "💬 Trả lời") {
            setReplyingTo(msg);
            // Có thể focus vào input nếu cần
          }
        }}
        message={selectedMessageForAction}
        emojiOptions={emojiOptions}
        onEmojiSelect={async (emoji, msg) => {
          await reactToMessage(msg._id, user._id, emoji);
          fetchMessages();
        }}
      />
      <ReactionModal
        isVisible={reactionModalVisible}
        onClose={() => setReactionModalVisible(false)}
        currentMessage={selectedMessageForAction}
        reactions={selectedMessageReactions}
        currentUser={user}
        onUnreact={async (messageId, emoji) => {
          await unreactToMessage(messageId, user._id, emoji);
          // Sau khi hủy react, cần cập nhật lại state tin nhắn
          fetchMessages();
        }}
      />
      {!modalVisible && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          onStartShouldSetResponder={() => true}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <GiftedChat
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
                onPressAvatar={(userInfo) => {
                  console.log(userInfo);
                  navigation.navigate("Profile", {
                    userId: userInfo._id,
                    avatar: userInfo.avatar,
                    name: userInfo.name,
                  });
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}
    </CommonPrimaryContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    marginTop: 10,
  },
  error: {
    color: "red",
    marginTop: 10,
  },
  filePreviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 5,
  },
  filePreviewContainer: {
    alignItems: "center",
    margin: 5,
  },
  reactionsContainer: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  reactionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 5,
    padding: 2,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 2,
    color: "gray",
  },
  sendContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  widgetContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
  },
  emojiButton: {
    fontSize: 24,
    padding: 5,
  },
});

export default GroupChatScreen;
