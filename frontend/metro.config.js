// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');
const { FileStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

// Use a stable on-disk store (shared across web/android)
const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, '.metro-cache');
config.cacheStores = [
  new FileStore({ root: path.join(root, 'cache') }),
];

// Configure resolver for crypto modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add polyfill aliases for Node.js modules
config.resolver.alias = {
  'crypto': require.resolve('react-native-get-random-values'),
  'stream': require.resolve('stream-browserify'),
  'buffer': require.resolve('buffer'),
};

// Enable package exports
config.resolver.unstable_enablePackageExports = true;

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

module.exports = config;
