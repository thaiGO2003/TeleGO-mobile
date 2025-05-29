import React from 'react';
import { View, StyleSheet } from 'react-native';
import CommonPrimaryContainer from '../../../components/layout/CommonPrimaryContainer';
import { COLORS } from '../../../constants/colors';

const AuthPrimaryContainer = ({ children, logoHeader }) => {
  return (
    <CommonPrimaryContainer>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          {logoHeader}
        </View>

        <View style={styles.contentContainer}>
          {children}
        </View>
      </View>
    </CommonPrimaryContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
});

export default AuthPrimaryContainer;
