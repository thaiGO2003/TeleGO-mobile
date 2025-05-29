import React, { useState, useEffect, useContext } from "react";
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
import { useColor } from "../../../context/ColorContext";
import { AuthContext } from "../../../context/AuthContext";
import { getFriendsList } from "../../../api/services/friendService";
import PrimaryButton from "../../../components/common/PrimaryButton";
import WhiteButton from "../../../components/common/WhiteButton";

const ForwardModal = ({ visible, onClose, onConfirm, messageToForward }) => {
  const [selected, setSelected] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  const { COLORS } = useColor();
  const { user } = useContext(AuthContext); // Lấy userId từ context

  useEffect(() => {
    if (visible && user?._id) {
      setLoading(true);
      getFriendsList(user._id)
        .then((data) => {
          // Extract friendInfo và set lại cho friends
          const parsed = data.map((item) => item.friendInfo);
          setFriends(parsed);
        })
        .catch((err) => {})
        .finally(() => setLoading(false));
    }
  }, [visible, user]);

  const toggleSelect = (userId) => {
    setSelected((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleConfirm = () => {
    onConfirm(selected);
    setSelected([]);
    onClose();
  };

  const renderItem = ({ item }) => {
    const isSelected = selected.includes(item._id);
    return (
      <TouchableOpacity
        onPress={() => toggleSelect(item._id)}
        style={[
          styles.itemContainer,
          { borderColor: isSelected ? COLORS.primary : "#ccc" },
        ]}
      >
        <View style={styles.selectionIndicator}>
          <View
            style={[
              styles.selectionCircle,
              { borderColor: isSelected ? COLORS.primary : "#aaa" },
            ]}
          >
            {isSelected && (
              <View
                style={[styles.selectedCircle, { backgroundColor: COLORS.primary }]}
              />
            )}
          </View>
        </View>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: "#ddd" }]}>
            <Text style={{ fontSize: 12, color: "#555" }}>
              {item.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={[styles.fullName, { lineHeight: 24 }]}>
          {item.fullName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { lineHeight: 24 }]}>
            Chọn người nhận
          </Text>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
            />
          )}

          <PrimaryButton
            onPress={handleConfirm}
            style={styles.confirmButton}
            title="Chuyển tiếp"
            disabled={selected.length === 0} // Disable button if no recipients are selected
          />

          <WhiteButton
            onPress={onClose}
            style={styles.cancelButton}
            title="Hủy"
          />
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
    borderRadius: 40,
    padding: 20,
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 5,
    borderRadius: 30,
    borderWidth: 2,
  },
  selectionIndicator: {
    marginRight: 10,
  },
  selectionCircle: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
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
    flex: 1,
  },
  confirmButton: {
    marginTop: 15,
  },
  cancelButton: {
    marginTop: 5,
  },
});

export default ForwardModal;