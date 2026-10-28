const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;

const UNSTABLE_INTERNALS_PATH = path.resolve(
  __dirname,
  'node_modules/react-native/src/unstable-internals-do-not-use.js'
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native/unstable-internals-do-not-use') {
    return {
      filePath: UNSTABLE_INTERNALS_PATH,
      type: 'sourceFile',
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
