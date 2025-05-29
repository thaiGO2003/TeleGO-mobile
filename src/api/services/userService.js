import axios from "axios";
import { API_BASE_URL } from "../../config";

const getUsers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const createUser = async (userData) => {
  try {
    console.log(userData);

    const response = await axios.post(`${API_BASE_URL}/users`, {
      phoneNumber: userData.phoneNumber,
      password: userData.password,
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const loginUser = async (phoneNumber, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/login`, {
      phoneNumber,
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const logoutUser = async (userId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/logout`, {
      userId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getUserById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/id/${id}`);
    return await response.data;
  } catch (error) {
    throw error;
  }
};

const getUserByPhoneNumber = async (phoneNumber) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/users/phone/${phoneNumber}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateUserByPhoneNumber = async (phoneNumber, userData) => {
  console.log(userData);
  try {
    const formData = new FormData();
    if (userData.fullName) formData.append("fullName", userData.fullName);
    if (userData.birthDate) formData.append("birthDate", userData.birthDate);
    if (userData.gender) formData.append("gender", userData.gender);
    if (userData.avatar === null) {
      formData.append("avatar", ""); // hoặc formData.append("avatar", null);
    } else if (userData.avatar) {
      if (userData.avatar.size > 2 * 1024 * 1024) {
        throw new Error("Kích thước ảnh đại diện vượt quá giới hạn 2MB.");
      }
      formData.append("avatar", {
        uri: userData.avatar.uri,
        name: userData.avatar.name || "avatar.jpg",
        type: userData.avatar.type || "image/jpeg",
      });
    }

    const response = await axios.put(
      `${API_BASE_URL}/users/phone/${phoneNumber}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deleteUserById = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/users/id/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getUserStatus = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/status/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const forgotPassword = async (phoneNumber) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/forgot-password`, {
      phoneNumber,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const changePassword = async (id, lastpassword, newpassword) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/users/change-password/${id}`,
      {
        lastpassword,
        newpassword,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const changePasswordByPhoneNumber = async (phoneNumber, newPassword) => {
  try {
    // Send the phone number and new password in the request body
    const response = await axios.put(
      `${API_BASE_URL}/users/change-password-phone`, // No need for phone number in URL
      { phoneNumber, newPassword } // Sending data in the body
    );
    return response.data; // Return the response from backend
  } catch (error) {
    throw error; // Propagate the error for the calling component to handle
  }
};

const getUserQRById = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/qr/${userId}`);
    return response.data.qrImageUrl; // Return only the qrImageUrl
  } catch (error) {
    throw error;
  }
};

export {
  getUserQRById,
  getUsers,
  createUser,
  loginUser,
  logoutUser,
  getUserById,
  getUserByPhoneNumber,
  updateUserByPhoneNumber,
  deleteUserById,
  getUserStatus,
  forgotPassword,
  changePassword,
  changePasswordByPhoneNumber,
};
