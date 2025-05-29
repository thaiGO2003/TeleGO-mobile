// hooks/useMessages.js
import { useState, useCallback } from 'react';
import { getMessages } from '../api/services/messageService';

const useMessages = (user, otherUsers, isGroupChat, groupId, otherUserIds) => {
  const [messages, setMessages] = useState([]);

  const formatMessages = useCallback(
    (rawMessages) => {
      return rawMessages.map((msg) => {
        const files = msg.fileUrls || [];
        const types = msg.fileTypes || [];
        const sender = otherUsers.find((u) => u._id === msg.sender) || {
          _id: msg.sender,
          fullName: msg.fullName,
          avatar: msg.avatar,
        };
        return {
          _id: msg._id,
          text: msg.recalled ? 'Tin nhắn đã bị thu hồi' : msg.message || '',
          createdAt: new Date(msg.createdAt),
          user: {
            _id: msg.fromSelf ? user._id : sender._id,
            name: msg.fromSelf ? user.fullName : sender.fullName,
            avatar: msg.fromSelf ? user.avatar : sender.avatar,
          },
          files: files.map((url, i) => ({ url, type: types[i] || '' })),
          recalled: msg.recalled || false,
          reactions: msg.reactions || [],
          replyTo: msg.replyTo
            ? {
                _id: msg.replyTo._id,
                text: msg.replyTo.text || '',
                user: {
                  _id: msg.replyTo.user?._id,
                  name: msg.replyTo.user?.fullName || 'Người dùng',
                },
                files: msg.replyTo.fileUrls?.map((url, i) => ({
                  url,
                  type: msg.replyTo.fileTypes?.[i] || '',
                })) || [],
              }
            : null,
        };
      });
    },
    [user, otherUsers]
  );

  const fetchMessages = useCallback(async () => {
    try {
      let rawMessages = [];
      if (isGroupChat) {
        console.log('Fetching group messages for groupId:', groupId);
        rawMessages = await getMessages(user._id, '', groupId);
      } else {
        const otherId = otherUserIds?.length === 1 ? otherUserIds[0] : null;
        if (!otherId) {
          console.warn('Không có otherId hợp lệ cho chat cá nhân');
          return;
        }
        console.log('Fetching messages for otherId:', otherId);
        rawMessages = await getMessages(user._id, otherId);
      }

      const formattedMessages = formatMessages(rawMessages);
      const sortedMessages = formattedMessages.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Lỗi lấy tin nhắn:', error);
    }
  }, [user, otherUserIds, isGroupChat, groupId, formatMessages]);

  return { messages, setMessages, fetchMessages };
};

export default useMessages;