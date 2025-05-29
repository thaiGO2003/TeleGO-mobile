import React, { createContext, useContext, useEffect, useRef } from "react";
import { AuthContext } from "./AuthContext";
import socket from "../utils/socket";
import * as Notifications from "expo-notifications";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user?._id) {
      socket.emit("add-user", user._id);
      console.log("🟢 Socket connected and user emitted:", user._id);
      const handleRequestAddUser = () => {
        socket.emit("add-user", user._id);
        console.log("🟢 Server requested add-user, emitted:", user._id);
      };

      socket.on("request-add-user", handleRequestAddUser);
      socket.on("msg-receive", (data) => {
        Notifications.scheduleNotificationAsync({
          content: {
            title: data.senderName || "Tin nhắn mới",
            body: data.message || "Bạn có một tin nhắn mới",
            sound: "default",
          },
          trigger: null,
        });
      });

      socket.on("group-msg-receive", (data) => {
        Notifications.scheduleNotificationAsync({
          content: {
            title: data.groupName || "Tin nhắn nhóm mới",
            body: `${data.senderName}: ${
              data.message || "Bạn có một tin nhắn nhóm mới"
            }`,
            sound: "default",
          },
          trigger: null,
        });
      });
    }

    socket.on("receiveFriendRequest", async (data) => {
      console.log("📩 Received friend request:", data);
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Lời mời kết bạn mới",
            body: `Bạn nhận được lời mời kết bạn từ ${data.fromUserId}`,
            sound: "default",
          },
          trigger: null,
        });
      } catch (err) {
        console.error("Error scheduling friend request notification:", err);
      }
    });

    // Handle friend request accepted
    socket.on("friendAccepted", async (data) => {
      console.log("✅ Friend request accepted:", data);
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Kết bạn thành công",
            body: `Bạn và ${data.from} giờ là bạn bè!`,
            sound: "default",
          },
          trigger: null,
        });
      } catch (err) {
        console.error("Error scheduling friend accepted notification:", err);
      }
    });

    return () => {
      if (socket) {
        // Cleanup can be added here if needed
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
