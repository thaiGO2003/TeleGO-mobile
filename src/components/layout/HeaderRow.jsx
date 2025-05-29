import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const HeaderRow = ({ title }) => { 
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginHorizontal: 22, marginTop: 22, width: '100%' }}>
      <Text style={{ fontSize: 20, color: COLORS.secondaryBlack, fontWeight: 'bold' }}>
        {title}
      </Text>
    </View>
  );
};

export default HeaderRow;
