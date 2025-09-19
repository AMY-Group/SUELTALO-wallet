// Polyfills for Solana Web3.js in React Native
import 'text-encoding-polyfill';
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

global.Buffer = Buffer;

// Additional polyfills if needed
if (typeof __dirname === 'undefined') global.__dirname = '/';
if (typeof __filename === 'undefined') global.__filename = '';
if (typeof process === 'undefined') {
  global.process = require('process');
} else {
  const bProcess = require('process');
  for (var p in bProcess) {
    if (!(p in process)) {
      process[p] = bProcess[p];
    }
  }
}

process.browser = false;
if (typeof Buffer === 'undefined') global.Buffer = require('buffer').Buffer;

// Fix for text encoding
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('text-encoding').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('text-encoding').TextDecoder;
}

// Fix for crypto randomBytes
import { getRandomValues } from 'react-native-get-random-values';

const crypto = {
  getRandomValues: getRandomValues,
  randomBytes: (size) => {
    const array = new Uint8Array(size);
    getRandomValues(array);
    return Buffer.from(array);
  }
};

global.crypto = crypto;

// Override the react-native-randombytes seed
if (global.rn_randombytes_seed) {
  global.rn_randombytes_seed(crypto.randomBytes(64));
}