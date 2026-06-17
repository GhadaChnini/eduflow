const BASE_URL = 'https://4fa39835-21e5-4722-93c3-e54ef3155437.created.app';

// Inject missing env vars so Expo picks them up regardless of .env issues
process.env.EXPO_PUBLIC_PROXY_BASE_URL =
  process.env.EXPO_PUBLIC_PROXY_BASE_URL || BASE_URL;
process.env.EXPO_PUBLIC_BASE_URL =
  process.env.EXPO_PUBLIC_BASE_URL || BASE_URL;

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra || {}),
    EXPO_PUBLIC_PROXY_BASE_URL: BASE_URL,
    EXPO_PUBLIC_BASE_URL: BASE_URL,
  },
});
