// Jest setup file for global test configuration
global.__DEV__ = true;

jest.mock('react-native-url-polyfill/auto', () => ({}));

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  setUser: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setContext: jest.fn(),
  startSpan: jest.fn((_opts, cb) => (typeof cb === 'function' ? cb() : undefined)),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios', Version: 15, select: (options) => options.ios ?? options.default },
  NativeModules: {},
  StyleSheet: { create: (styles) => styles },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('./mocks/asyncStorage.js')
);

// Mock React Native modules
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ cancelled: true })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ cancelled: true })),
  MediaTypeOptions: {
    Images: 'images',
    Videos: 'videos',
    All: 'all',
  },
}));

// Global test timeout
jest.setTimeout(10000);
