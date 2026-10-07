const isAndroid =
  typeof process !== 'undefined' &&
  (process.env?.EXPO_OS === 'android' || process.env?.REACT_NATIVE_PLATFORM === 'android');

const DEFAULT_LOCAL_HOST = isAndroid ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

export const mobileConfig = {
  apiBaseUrl: process.env?.EXPO_PUBLIC_API_URL || `${DEFAULT_LOCAL_HOST}/api/v1`,
  defaultTimeoutMs: 10000,
};
