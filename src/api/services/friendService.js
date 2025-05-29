import axios from "axios";
import { API_BASE_URL } from "../../config";

// 1. Gửi lời mời kết bạn
const sendFriendRequest = async (idUser1, idUser2) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/friends/add-friend`, {
      idUser1,
      idUser2,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 2. Chấp nhận lời mời kết bạn
const acceptFriendRequest = async (idUser1, idUser2) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/friends/accept-friend`, {
      idUser1,
      idUser2,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 3. Từ chối lời mời kết bạn
const rejectFriendRequest = async (idUser1, idUser2) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/friends/reject-friend`, {
      idUser1,
      idUser2,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 4. Hủy kết bạn
const unfriendUser = async (idUser1, idUser2) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/friends/unfriend-friend`, {
      idUser1,
      idUser2,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 5. Lấy danh sách bạn bè
const getFriendsList = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/friends/get-friend/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 6. Lấy danh sách lời mời kết bạn đang chờ
const getPendingFriendRequests = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/friends/get-add-friend/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriendUser,
  getFriendsList,
  getPendingFriendRequests,
};
