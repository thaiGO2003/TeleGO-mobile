import axios from "axios";
import { API_BASE_URL } from "../../config";
export const createGroup = async (groupName, groupMembers, groupAdmin) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/groups/create-group`,
      { groupName, groupMembers, groupAdmin },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating group:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw new Error(error.response?.data?.message || 'Không thể tạo nhóm');
  }
};
// Thêm thành viên vào nhóm
export const addGroupMembers = async (groupId, memberIds) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/groups/add-member`, {
      groupId,
      memberIds,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding members:", error);
    throw error.response?.data?.message || "Failed to add members";
  }
};

// Xóa thành viên khỏi nhóm
export const removeGroupMembers = async (groupId, memberIds, requesterId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/groups/remove-member`, {
      groupId,
      memberIds,
      requesterId,
    });
    return response.data;
  } catch (error) {
    console.error("Error removing members:", error);
    throw error.response?.data?.message || "Failed to remove members";
  }
};

// Gán phó nhóm
export const setDeputy = async (groupId, deputyId, adminId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/groups/set-deputy`, {
      groupId,
      deputyId,
      adminId,
    });
    return response.data;
  } catch (error) {
    console.error("Error setting deputy:", error);
    throw error.response?.data?.message || "Failed to set deputy";
  }
};

// Gỡ phó nhóm
export const removeDeputy = async (groupId, memberId, adminId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/groups/remove-deputy`, {
      groupId,
      memberId,
      adminId,
    });
    return response.data;
  } catch (error) {
    console.error("Error removing deputy:", error);
    throw error.response?.data?.message || "Failed to remove deputy";
  }
};

// Đổi trưởng nhóm
export const changeAdmin = async (groupId, adminId, newAdminId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/groups/change-admin`, {
      groupId,
      adminId,
      newAdminId,
    });
    return response.data;
  } catch (error) {
    console.error("Error changing admin:", error);
    throw error.response?.data?.message || "Failed to change admin";
  }
};

// Đổi tên nhóm
export const renameGroup = async (groupId, idMember, newName) => {
  console.log("renameGroup: ",groupId, idMember, newName);
  try {
    const response = await axios.post(`${API_BASE_URL}/groups/rename-group`, {
      groupId,
      idMember,
      newName,
    });
    return response.data;
  } catch (error) {
    console.error("Error renaming group:", error);
    throw error.response?.data?.message || "Failed to rename group";
  }
};

// Xoá nhóm
export const deleteGroup = async (groupId, memberId) => {
  try {
    console.log(groupId, memberId);
    const response = await axios.delete(`${API_BASE_URL}/groups/delete-group`, {
      data: {
        groupId,
        memberId,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error("Error deleting group:", error);
    throw error.response?.data?.message || "Failed to delete group";
  }
};

// Rời khỏi nhóm
export const leaveGroup = async (groupId, memberId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/groups/leave-group`, {
      groupId,
      memberId,
    });
    return response.data;
  } catch (error) {
    console.error("Error leaving group:", error);
    throw error.response?.data?.message || "Failed to leave group";
  }
};

// Lấy thông tin nhóm theo ID
export const getGroupById = async (groupId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/groups/id/${groupId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching group:", error);
    throw error.response?.data?.message || "Failed to get group";
  }
};

// Lấy danh sách tất cả nhóm
export const getAllGroups = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/groups`);
    return response.data;
  } catch (error) {
    console.error("Error fetching all groups:", error);
    throw error.response?.data?.message || "Failed to get all groups";
  }
};

// Lấy danh sách thành viên trong nhóm
export const getMembersInGroup = async (groupId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/groups/get-member/${groupId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching group members:", error);
    throw error.response?.data?.message || "Failed to get group members";
  }
};

// Cập nhật avatar nhóm
export const updateGroupAvatar = async (groupId, formData) => {
  try {
    formData.append("groupId", groupId); // thêm groupId vào FormData

    const response = await axios.put(`${API_BASE_URL}/groups/update-avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error updating avatar:", error);
    throw error.response?.data?.message || "Failed to update avatar";
  }
};


// Lấy danh sách nhóm kèm tin nhắn cuối của người dùng
export const getGroupsWithLastMessageByUserId = async (userId) => {
  try {
    console.error(`${API_BASE_URL}/groups/with-last-message/${userId}`);
    const response = await axios.get(`${API_BASE_URL}/groups/with-last-message/${userId}`);
    console.warn(response.data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to get groups with last message";
  }
};

// Lấy mã QR của nhóm
export const getGroupQRCode = async (groupId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/group-qr/${groupId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching group QR code:", error);
    throw error.response?.data?.message || "Failed to fetch group QR code";
  }
};

// Tham gia nhóm
export const joinGroup = async (groupId, userId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/groups/join-group`, {
      groupId,
      userId,
    });
    return response.data;
  } catch (error) {
    console.error("Error joining group:", error);
    throw error.response?.data?.message || "Failed to join group";
  }
};
