import React from 'react';
import { FlatList, TouchableOpacity, Text, View, Image } from 'react-native';

const FriendList = ({ data, handlePress }) => {
  return (
    <FlatList
      data={data}
      horizontal={true}
      renderItem={({ item, index }) => (
        <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity style={{ paddingVertical: 15, marginRight: 22 }} onPress={() => handlePress(item)}>
            <Image source={{ uri: item.avatar }} resizeMode="contain" style={{ height: 50, width: 50, borderRadius: 25 }} />
          </TouchableOpacity>
          <Text>{item.fullName.substring(0, 5)}...</Text>
        </View>
      )}
      keyExtractor={(item, index) => index.toString()}
    />
  );
};

export default FriendList;
