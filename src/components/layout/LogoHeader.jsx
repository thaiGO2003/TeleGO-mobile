import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const LogoHeader = ({ logoSource, text = 'TeleGO' }) => {
  return (
    <View style={styles.logoContainer}>
      <Image source={logoSource} style={styles.logo} />
      <Text style={styles.logoText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
    lineHeight: 36
  },
});

export default LogoHeader;
