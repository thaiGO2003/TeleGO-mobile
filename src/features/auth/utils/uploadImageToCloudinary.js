// src/utils/uploadImage.js

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_UPLOAD_URL } from "../../../config/cloudinaryConfig";
import sha1 from "js-sha1"; // Đảm bảo bạn đã cài package này (npm install js-sha1)

export const uploadImageToCloudinary = async (imageUri) => {
  // Tạo timestamp
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Tạo chuỗi để ký (signature)
  const paramsToSign = `folder=TeleGO&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = sha1(paramsToSign);  // Sử dụng sha1 để tạo chữ ký

  // Tạo FormData để gửi yêu cầu
  const formData = new FormData();
  const fileType = imageUri.endsWith(".png") ? "image/png" : "image/jpeg";

formData.append("file", {
  uri: imageUri,
  type: fileType,
  name: "avatar.jpg",
});

  formData.append("timestamp", timestamp);
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("signature", signature);
  formData.append("folder", "TeleGO");  // Thư mục lưu trữ trên Cloudinary

  try {
    const res = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });
    

    const data = await res.json();
    console.log("Cloudinary response:", data); // 👈 Thêm dòng này

    if (data.secure_url) {
      return data.secure_url;  // Trả về URL hình ảnh đã upload
    } else {
      throw new Error("Không thể upload hình ảnh lên Cloudinary. "+data.message);
    }
  } catch (err) {
    throw err;  // Đẩy lỗi ra ngoài để xử lý sau
  }
};
