// components/ChatInputToolbar.js
import React from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InputToolbar } from 'react-native-gifted-chat';

const ChatInputToolbar = ({
  props,
  pendingFiles,
  setPendingFiles,
  replyingTo,
  setReplyingTo,
  isWidgetBarVisible,
  setIsWidgetBarVisible,
  handleMediaPick,
  handleFilePick,
  handleGifPick,
  isGroupChat,
  navigation,
  groupId,
  groupName,
  groupMembers,
  groupAvatar,
  styles,
  getFileIcon,
}) => {
  const renderReplyPreview = () => {
    if (!replyingTo) return null;
    return (
      <View style={styles.replyPreview}>
        <Text style={{ fontWeight: '600', color: '#2C3E50', fontSize: 12, marginBottom: 4 }}>
          Đang trả lời: {replyingTo.user?.name || 'Người dùng'}
        </Text>
        {(replyingTo.recalled || replyingTo.text?.trim()) && (
          <Text
            style={{
              color: '#2C3E50',
              fontSize: 14,
              fontStyle: replyingTo.recalled ? 'italic' : 'normal',
            }}
          >
            {replyingTo.recalled ? 'Tin nhắn đã được thu hồi' : replyingTo.text}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => setReplyingTo(null)}
          style={{ position: 'absolute', top: 6, right: 6 }}
        >
          <Ionicons name="close-circle-outline" size={18} color="#7F8C8D" />
        </TouchableOpacity>
      </View>
    );
  };

  const toggleWidgetBar = () => setIsWidgetBarVisible((prev) => !prev);

  return (
    <View style={styles.inputContainer}>
      {renderReplyPreview()}
      {isWidgetBarVisible && (
        <View style={styles.widgetBar}>
          <TouchableOpacity style={styles.widgetButton} onPress={() => handleMediaPick('camera')}>
            <Ionicons name="camera-outline" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.widgetButton} onPress={() => handleMediaPick('gallery')}>
            <Ionicons name="image-outline" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.widgetButton} onPress={() => handleMediaPick('video')}>
            <Ionicons name="videocam-outline" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.widgetButton} onPress={handleFilePick}>
            <Ionicons name="document-attach-outline" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.widgetButton} onPress={handleGifPick}>
            <Ionicons name="happy-outline" size={24} color="#2C3E50" />
          </TouchableOpacity>
          {isGroupChat && (
            <TouchableOpacity
              style={styles.widgetButton}
              onPress={() => {
                try {
                  navigation.navigate('GroupInfo', { groupId, groupName, groupMembers, groupAvatar });
                } catch (error) {
                  console.error('Navigation to GroupInfo failed:', error);
                  Alert.alert('Lỗi', 'Màn hình GroupInfo chưa được định nghĩa.');
                }
              }}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#2C3E50" />
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={styles.inputToolbar}>
        <TouchableOpacity style={styles.plusButton} onPress={toggleWidgetBar}>
          <Ionicons
            name={isWidgetBarVisible ? 'close-circle-outline' : 'add-circle-outline'}
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
              {file.type.startsWith('image/') || file.type.startsWith('video/') ? (
                <Image source={{ uri: file.uri }} style={styles.filePreviewImage} />
              ) : (
                <Ionicons name={getFileIcon(file.uri)} size={24} color="#2C3E50" />
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

export default ChatInputToolbar;