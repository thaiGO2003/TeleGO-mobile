// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Thêm 'cjs' vào các phần mở rộng file
defaultConfig.resolver.sourceExts.push('cjs');

// Tắt package exports không ổn định (nếu cần thiết cho gói nào đó như `react-native-reanimated`)
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;
