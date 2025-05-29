// src/components/common/SettingOption.js
import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useColor } from '../../../context/ColorContext';

const SettingOption = ({ icon, label, IconComponent, onPress }) => {
  const { COLORS } = useColor();
  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
      }}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconComponent name={icon} size={24} color={COLORS.black} />
        <Text
          style={{
            marginLeft: 12,
            fontSize: 16,
            fontWeight: '500',
            color: COLORS.black,
            lineHeight: 20
          }}
        >
          {label}
        </Text>
      </View>
      <MaterialIcons name="keyboard-arrow-right" size={24} color={COLORS.black} />
    </TouchableOpacity>
  );
};

export default SettingOption;
