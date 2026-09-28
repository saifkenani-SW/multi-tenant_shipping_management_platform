'use strict';
/**
 * instrumentation.preload.js
 *
 * Plain CommonJS shim — always present, never compiled.
 * Loaded via NODE_OPTIONS in `start:dev` so OTel SDK starts
 * inside EVERY child process the Nest CLI spawns.
 */
require('dotenv/config');

// Register ts-node so the TypeScript instrumentation file can be required directly
require('ts-node').register({
  transpileOnly: true,
  skipProject: false,
});

require('./instrumentation');
