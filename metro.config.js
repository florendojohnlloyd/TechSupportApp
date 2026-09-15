// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

// Disable the experimental "live bindings" transform.
// It has a known bug in @expo/metro-config (SDK 54.0.2 - 57.x) that throws
// "Cannot assign to property 'protocol'/'default' which has only a getter"
// on Hermes. See https://github.com/expo/expo/issues/49912
process.env.EXPO_UNSTABLE_LIVE_BINDINGS = 'false';

const config = getDefaultConfig(__dirname);

module.exports = config;
