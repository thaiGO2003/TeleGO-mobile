// components/MessageBubble.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableNativeFeedback,
  Platform,
} from 'react-native';

const MessageBubble = ({
  props,
  user,
  isGroupChat,
  handleLongPress,
  setReactionModalVisible,
  setSelectedMessageForAction,
  setSelectedMessageReactions,
  styles,
}) => {
  const currentRenderMessage = props.currentMessage;
  const previousMessage = props.previousMessage;
  const BubbleWrapper = Platform.OS === 'android' ? TouchableNativeFeedback : TouchableOpacity;
  const messageReactions = currentRenderMessage?.reactions || [];
  const aggregatedReactions = messageReactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {});
  const isMine = currentRenderMessage?.user?._id === user._id;
  const isRecalled = currentRenderMessage?.recalled;
  const isReply = !!currentRenderMessage?.replyTo;
  const showAvatar =
    isGroupChat &&
    !isMine &&
    !isRecalled &&
    (!previousMessage ||
      previousMessage.user?._id !== currentRenderMessage.user?._id ||
      previousMessage.recalled);

  const renderReplyTo = (replyTo) => {
    if (!replyTo) return null;
    const isMineReply = replyTo.user?._id === user._id;
    return (
      <View
        style={{
          backgroundColor: isMineReply ? '#E8ECEF' : '#D8D8D8',
          borderRadius: 12,
          padding: 8,
          marginBottom: 8,
          borderLeftWidth: 4,
          borderLeftColor: isMineReply ? '#4A90E2' : '#9B59B6',
          opacity: 0.9,
        }}
      >
        <Text style={{ fontWeight: '600', fontSize: 12, marginBottom: 4, color: '#2C3E50' }}>
          {replyTo.user?.name || 'Người dùng'}
        </Text>
        {(replyTo.recalled || replyTo.text?.trim()) && (
          <Text
            style={{
              color: '#2C3E50',
              fontSize: 14,
              fontStyle: replyTo.recalled ? 'italic' : 'normal',
            }}
          >
            {replyTo.recalled ? 'Tin nhắn đã được thu hồi' : replyTo.text}
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

  return (
    <BubbleWrapper
      onLongPress={() => handleLongPress(currentRenderMessage, isRecalled)}
      delayLongPress={150}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          marginVertical: 6,
          marginHorizontal: 12,
        }}
      >
        <View
          style={[
            styles.bubble,
            {
              maxWidth: `${80}%`,
              backgroundColor: isMine ? '#3797F0' : '#e0e0e0',
              opacity: isRecalled ? 0.7 : 1,
            },
            isMine ? styles.bubbleRight : styles.bubbleLeft,
          ]}
        >
          {isReply && renderReplyTo(currentRenderMessage.replyTo)}
          {!(currentRenderMessage.text?.trim() === '' && !isRecalled) && (
            <Text
              style={{
                color: isRecalled ? '#7F8C8D' : isMine ? '#FFFFFF' : '#000000',
                fontSize: 16,
                fontStyle: isRecalled ? 'italic' : 'normal',
              }}
            >
              {isRecalled ? 'Tin nhắn đã được thu hồi' : currentRenderMessage.text}
            </Text>
          )}
          {!isRecalled && currentRenderMessage.files?.length > 0 && (
            <View style={{ marginTop: 8 }}>{props.renderCustomView(props)}</View>
          )}
          <Text
            style={{
              fontSize: 10,
              color: '#ffffff',
              textAlign: isMine ? 'right' : 'left',
              marginTop: 4,
            }}
          >
            {new Date(currentRenderMessage.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {isGroupChat && !isMine && (
            <Text style={{ fontSize: 12, color: '#ffffff', textAlign: 'left', marginTop: 2 }}>
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
                  {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
                </View>
              ))}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </BubbleWrapper>
  );
};

export default MessageBubble;