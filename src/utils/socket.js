// src/socket.js
import { io } from "socket.io-client";
import { BASE_URL } from "../config/index"; // Đảm bảo đường dẫn đúng

const socket = io(BASE_URL, {
    transports: ["websocket"], // đảm bảo dùng WebSocket, không bị fallback sang polling
  });
export default socket;
