import React, { useEffect, useState, useContext } from "react";
import {
  Modal,
  View,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { getUserById } from "../../../api/services/userService";
import { AuthContext } from "../../../context/AuthContext";
import { useColor } from "../../../context/ColorContext";
const ReactionModal = ({
  isVisible,
  onClose,
  reactions,
  onUnreact,
  currentMessage,
}) => {
  const { user } = useContext(AuthContext);
  const { COLORS } = useColor();
  const [reactionUsers, setReactionUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const detailedReactions = await Promise.all(
          reactions.map(async (r) => {
            console.log(r);
            const userInfo = await getUserById(r.user);
            return {
              ...r,
              fullName: userInfo.fullName,
              avatar: userInfo.avatar,
              messageId: r.messageId,
            };
          })
        );
        setReactionUsers(detailedReactions);
      } catch (err) {
        console.error("Failed to fetch reaction users:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isVisible) fetchUsers();
  }, [isVisible]);
  useEffect(() => {
    if (!loading && reactionUsers.length === 0) {
      onClose();
    }
  }, [reactionUsers, loading]);

  const renderItem = ({ item }) => {
    const isCurrentUser = item.user === user._id;
    return (
      <View style={styles.itemContainer}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: "#ddd" }]}>
            <Text style={{ fontSize: 12, color: "#555" }}>
              {item.fullName?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.fullName}>{item.fullName}</Text>

        {isCurrentUser && (
          <TouchableOpacity
            style={[styles.unreactButton, { backgroundColor: COLORS.red }]}
            onPress={async () => {
              await onUnreact(currentMessage._id, user._id);
              setReactionUsers((prev) =>
                prev.filter((r) => r.user !== user._id)
              );
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", lineHeight: 20 }}>
              Bỏ
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Phản ứng</Text>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <FlatList
              data={reactionUsers}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderItem}
            />
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={{ textAlign: "center", fontWeight: "bold" }}>
              Đóng
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#000000aa",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  emoji: {
    fontSize: 18,
    lineHeight: 24,
    marginRight: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  fullName: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  unreactButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 10,
  },
});

export default ReactionModal;
