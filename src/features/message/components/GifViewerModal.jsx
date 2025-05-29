import React, { useRef, useState, useEffect } from "react";
import {
  Modal,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  View,
  PanResponder,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const GifViewerModal = ({
  images,
  imageIndex,
  visible,
  onRequestClose,
  onIndexChange,
}) => {
  const [webViewKey, setWebViewKey] = useState(0); // ép WebView render lại
  const gifUrl = images?.[imageIndex]?.uri || "";
  useEffect(() => {
    setWebViewKey((prev) => prev + 1); // mỗi lần imageIndex thay đổi → ép WebView load lại
  }, [imageIndex]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          // Lướt sang phải
          const newIndex = Math.max(imageIndex - 1, 0);
          if (newIndex !== imageIndex) onIndexChange(newIndex);
        } else if (gestureState.dx < -50) {
          // Lướt sang trái
          const newIndex = Math.min(imageIndex + 1, images.length - 1);
          if (newIndex !== imageIndex) onIndexChange(newIndex);
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.container} {...panResponder.panHandlers}>
        <WebView
  key={webViewKey}
  source={{
    html: `
      <html>
      <head>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background: black;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
          }
          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <img src="${gifUrl}" />
      </body>
      </html>
    `,
  }}
  style={{ flex: 1 }}
/>

        <TouchableOpacity onPress={onRequestClose} style={styles.closeBtn}>
          <Ionicons name="close-circle-outline" size={40} color="white" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default GifViewerModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  closeBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
});
