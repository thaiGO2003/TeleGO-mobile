import React from 'react';
import { StyleSheet } from 'react-native';
import AuthPrimaryContainer from '../../auth/components/AuthPrimaryContainer';
import WhiteButton from '../../../components/common/WhiteButton';
import LogoHeader from '../../../components/layout/LogoHeader';
import { useTranslation } from 'react-i18next';

const AuthEntryScreen = ({ navigation }) => {
 const { t } = useTranslation();

 return (
  <AuthPrimaryContainer
   logoHeader={<LogoHeader logoSource={require('../../../assets/icons/TeleGO.png')} text={t('auth.welcome')} />}
  >
   <WhiteButton
    title={t('auth.login')}
    onPress={() => navigation.navigate('Login')}
   />
   <WhiteButton
    title={t('auth.register')}
    onPress={() => navigation.navigate('RegisterCredentials')}
   />
  </AuthPrimaryContainer>
 );
};

export default AuthEntryScreen;

const styles = StyleSheet.create({});