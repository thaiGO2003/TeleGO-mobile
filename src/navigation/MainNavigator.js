import React, { useState, useRef, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
} from "react-native";
import { useModal } from "../context/ModalContext";

import { Ionicons } from "@expo/vector-icons";
import TabNavigator from "./TabNavigator";
import GeminiChatModal from "../features/message/components/GeminiChatModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const Stack = createNativeStackNavigator();

const MainNavigator = () => {
  const [geminiModalVisible, setGeminiModalVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { setModalVisible } = useModal();
  const pan = useRef(
    new Animated.ValueXY({ x: SCREEN_WIDTH - 80, y: SCREEN_HEIGHT - 320 })
  ).current;
  useEffect(() => {
    setModalVisible(geminiModalVisible);
  }, [geminiModalVisible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        setIsDragging(true);
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        setIsDragging(false);
        pan.flattenOffset();

        const finalX = pan.x._value < SCREEN_WIDTH / 2 ? 20 : SCREEN_WIDTH - 80;
        const finalY = Math.min(
          Math.max(pan.y._value, 40),
          SCREEN_HEIGHT - 120
        );

        Animated.spring(pan, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
        }).start();
      },
      onPanResponderTerminationRequest: () => true,
      onShouldBlockNativeResponder: () => false,
    })
  ).current;

  const handlePress = () => {
    if (!isDragging) setGeminiModalVisible(true);
  };

  return (
    <>
      <Stack.Navigator
        initialRouteName="Tabs"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Tabs" component={TabNavigator} />
      </Stack.Navigator>

      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.floatingButton, pan.getLayout()]}
      >
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
          <Ionicons name="chatbubble-ellipses" size={30} color="white" />
        </TouchableOpacity>
      </Animated.View>

      <GeminiChatModal
        visible={geminiModalVisible}
        onClose={() => setGeminiModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    backgroundColor: "#007AFF",
    borderRadius: 30,
    padding: 15,
    elevation: 5,
    zIndex: 999,
  },
});

export default MainNavigator;
