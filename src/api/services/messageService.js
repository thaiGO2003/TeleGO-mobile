import axios from "axios";
import { API_BASE_URL } from "../../config";
import socket from "../../utils/socket";

const messageApi = `${API_BASE_URL}/messages`;

// 1. Gửi tin nhắn (text, GIF, hoặc kèm files)
export const sendMessage = async (
  from,
  to,
  message,
  groupId = null,
  files = [],
  isGif = false
) => {
  try {
    const payload = { from, to, message, groupId, files, isGif };
    const response = await axios.post(`${messageApi}/addmsg`, payload);
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error.response?.data || error;
  }
};

// 2. Lấy lịch sử tin nhắn (cá nhân hoặc nhóm)
export const getMessages = async (from, to = null, groupId = null) => {
  try {
    console.log("Fetching messages:", { from, to, groupId });
    const response = await axios.post(`${messageApi}/getmsg`, {
      from,
      to,
      groupId,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error.response?.data || error;
  }
};

// 3. Xóa tin nhắn theo ID (xóa hoàn toàn)
export const deleteMessage = async (messageId) => {
  try {
    const response = await axios.delete(`${messageApi}/deletemsg/${messageId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error.response?.data || error;
  }
};

// 4. Thu hồi tin nhắn
export const recallMessage = async (messageId) => {
  try {
    const response = await axios.post(`${messageApi}/recallmsg/${messageId}`);
    return response.data;
  } catch (error) {
    console.error("Error recalling message:", error);
    throw error.response?.data || error;
  }
};

// 5. Chuyển tiếp tin nhắn
export const forwardMessage = async (from, to, messageId, groupId = null) => {
  try {
    const payload = { from, to, messageId, groupId };
    const response = await axios.post(`${messageApi}/forwardmsg`, payload);
    return response.data;
  } catch (error) {
    console.error("Error forwarding message:", error);
    throw error.response?.data || error;
  }
};

// 6. Gửi tin nhắn kèm media
export const sendMediaMessage = async (
  from,
  to = null,
  groupId = null,
  files = [],
  text = "",
  emoji = "",
  replyTo = null
) => {
  try {
    const safeFiles = Array.isArray(files) ? files : [];

    const formData = new FormData();
    formData.append("from", from);
    if (to) formData.append("to", to);
    if (groupId) formData.append("groupId", groupId);
    if (text) formData.append("text", text);
    if (emoji) formData.append("emoji", emoji);
    if (replyTo) formData.append("replyTo", replyTo);

    safeFiles.forEach((file, index) => {
      if (file && (file.uri || file instanceof File)) {
        const fileName =
          file.name || `upload-${index}.${file.type?.split("/")[1] || "jpg"}`;
        formData.append("files", file, fileName);
      } else {
        console.warn(`Invalid file at index ${index}:`, file);
      }
    });

    console.log("Sending media message:", {
      from,
      to,
      groupId,
      emoji,
      text,
      replyTo,
      files: safeFiles.length,
    });

    const response = await axios.post(`${messageApi}/sendmedia`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  } catch (error) {
    console.error("Error sending media message:", error);
    throw error.response?.data || error;
  }
};

// 7. Xóa tin nhắn chỉ phía tôi
export const deleteMessageForMe = async (messageId, userId) => {
  try {
    const response = await axios.post(`${messageApi}/deletemsgforme`, {
      messageId,
      userId,
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting message for me:", error);
    throw error.response?.data || error;
  }
};

// 8. Lấy toàn bộ tin nhắn của một người dùng
export const getUserMessages = async (userId) => {
  try {
    const response = await axios.get(`${messageApi}/usermessages/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user messages:", error);
    throw error.response?.data || error;
  }
};

// 9. Lấy tin nhắn cuối cùng của mỗi cuộc trò chuyện
export const getLastMessages = async (userId) => {
  try {
    const response = await axios.get(`${messageApi}/lastmessages/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching last messages:", error);
    throw error.response?.data || error;
  }
};

// 10. Thêm reaction vào tin nhắn
export const reactToMessage = async (messageId, userId, emoji) => {
  try {
    const response = await axios.post(`${messageApi}/react`, {
      messageId,
      userId,
      emoji,
    });
    return response.data;
  } catch (error) {
    console.error("Error reacting to message:", error);
    throw error.response?.data || error;
  }
};

// 11. Xóa reaction khỏi tin nhắn
export const unreactToMessage = async (messageId, userId) => {
  try {
    const response = await axios.post(`${messageApi}/unreact`, {
      messageId,
      userId,
    });
    return response.data;
  } catch (error) {
    console.error("Error unreacting to message:", error);
    throw error.response?.data || error;
  }
};

// 12. Lấy tin nhắn theo ID
export const getMessageById = async (messageId) => {
  try {
    const response = await axios.get(`${messageApi}/${messageId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching message by ID:", error);
    throw error.response?.data || error;
  }
};

// 13. Xóa toàn bộ hội thoại (cá nhân hoặc nhóm)
export const deleteConversation = async (
  userId1,
  userId2 = null,
  groupId = null
) => {
  try {
    const payload = { userId1, userId2, groupId };
    const response = await axios.post(
      `${messageApi}/delete-conversation`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw error.response?.data || error;
  }
};

// 14. Lấy danh sách nhóm với tin nhắn cuối cùng
export const getGroupsWithLastMessage = async (userId) => {
  try {
    const response = await axios.get(
      `${messageApi}/with-last-message/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching groups with last message:", error);
    throw error.response?.data || error;
  }
};
export const pinMessage = async (messageId, userId) => {
  try {
    const response = await axios.post(`${messageApi}/pinmsg/${messageId}`, {
      userId,
    });
    return response.data;
  } catch (error) {
    console.error("Error pinning message:", error);
    throw error.response?.data || error;
  }
};

export const unpinMessage = async (messageId, userId) => {
  try {
    const response = await axios.post(`${messageApi}/unpinmsg/${messageId}`, {
      userId,
    });
    return response.data;
  } catch (error) {
    console.error("Error unpinning message:", error);
    throw error.response?.data || error;
  }
};

// 17. Lấy danh sách tin nhắn đã ghim
export const getPinnedMessages = async (from, to = null, groupId = null) => {
  try {
    const response = await axios.post(`${messageApi}/getPinnedMessages`, {
      from,
      to,
      groupId,
    });
    return response.data;
  } catch (error) {
    console.error("Error getting pinned messages:", error);
    throw error.response?.data || error;
  }
};

export const createPoll = async (from, groupId, question, options) => {
  try {
    const payload = { from, groupId, question, options };
    const response = await axios.post(`${messageApi}/create-poll`, payload);
    return response.data;
  } catch (error) {
    console.error("Error creating poll:", error);
    throw error.response?.data || error;
  }
};

export const votePoll = async (messageId, userId, optionIndex) => {
  try {
    const payload = { messageId, userId, optionIndex };
    const response = await axios.post(`${messageApi}/vote-poll`, payload);
    return response.data;
  } catch (error) {
    console.error("Error voting poll:", error);
    throw error.response?.data || error;
  }
};

export const removeVote = async (messageId, userId, optionIndex) => {
  try {
    const payload = { messageId, userId, optionIndex };
    const response = await axios.post(`${messageApi}/remove-vote`, payload);
    return response.data;
  } catch (error) {
    console.error("Error removing vote:", error);
    throw error.response?.data || error;
  }
};