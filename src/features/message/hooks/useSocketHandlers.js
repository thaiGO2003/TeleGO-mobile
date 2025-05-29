// hooks/useSocketHandlers.js
import { useEffect } from 'react';
import socket from '../../../utils/socket';

const useSocketHandlers = ({ user, otherUsers, isGroupChat, groupId, fetchMessages, setMessages, t }) => {
  useEffect(() => {
    if (!user || (!otherUsers.length && !isGroupChat)) return;

    const handleMessageReceive = (message) => {
      console.log('Received message:', message);
      if (isGroupChat && message.groupId === groupId) {
        fetchMessages();
      } else if (!isGroupChat && message.from === otherUsers[0]?._id) {
        fetchMessages();
      }
    };

    const handleMessageRecalled = ({ messageId, groupId: recalledGroupId }) => {
      console.log('Message recalled:', messageId);
      if (isGroupChat && recalledGroupId === groupId) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId
              ? { ...msg, text: t('message.recalled'), recalled: true, files: [] }
              : msg
          )
        );
      } else if (!isGroupChat && otherUsers.some((u) => u._id === message.from)) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId
              ? { ...msg, text: t('message.recalled'), recalled: true, files: [] }
              : msg
          )
        );
      }
    };

    const handleMessageDeleted = ({ messageId, groupId: deletedGroupId }) => {
      console.log('Message deleted:', messageId);
      if (isGroupChat && deletedGroupId === groupId) {
        setMessages((prevMessages) => prevMessages.filter((m) => m._id !== messageId));
      } else if (!isGroupChat && otherUsers.some((u) => u._id === message.from)) {
        setMessages((prevMessages) => prevMessages.filter((m) => m._id !== messageId));
      }
    };

    socket.on('msg-receive', handleMessageReceive);
    socket.on('group-msg-receive', handleMessageReceive);
    socket.on('msg-recall', handleMessageRecalled);
    socket.on('group-msg-recall', handleMessageRecalled);
    socket.on('msg-delete', handleMessageDeleted);
    socket.on('group-msg-delete', handleMessageDeleted);

    return () => {
      socket.off('msg-receive', handleMessageReceive);
      socket.off('group-msg-receive', handleMessageReceive);
      socket.off('msg-recall', handleMessageRecalled);
      socket.off('group-msg-recall', handleMessageRecalled);
      socket.off('msg-delete', handleMessageDeleted);
      socket.off('group-msg-delete', handleMessageDeleted);
    };
  }, [user, otherUsers, isGroupChat, groupId, fetchMessages, setMessages, t]);
};

export default useSocketHandlers;