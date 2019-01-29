#!/usr/bin/env node
// forked from ericclemmons/per-env

const spawn = require('cross-spawn');

var pkg = require(process.cwd() + '/package.json');
var spawnSync = require('child_process').spawnSync;
var NODE_ENV = process.env.NODE_ENV || '';

var env = Object.assign(
  {},
  // Default NODE_ENV
  {
    NODE_ENV: NODE_ENV
  },
  // Override with package.json custom env variables
  (pkg && pkg['per-env'] && pkg['per-env'][NODE_ENV]) || {},
  // Explicit env takes precedence
  process.env
);

// Default blank to "production"
if (env.NODE_ENV.trim() === '') env.NODE_ENV = 'production';

var command = 'yarn';

var script = [
  env.npm_lifecycle_event, // e.g. "start"
  env.NODE_ENV
].join(':'); // e.g. "start:development"

// Check If the script exists
if (!pkg || !pkg.scripts || !pkg.scripts[script]) {
  console.warn('[per-env] [Warning] Cannot find the script: ' + script);
  process.exit(0);
}

var args = ['run', script].concat(
  // Extra arguments after "per-env"
  process.argv.slice(2)
);

var options = {
  cwd: process.cwd(),
  env: env,
  stdio: 'inherit'
};

//using cross-spawn
var result = spawn.sync(command, args, options);
//var result = spawnSync(command, args, options);

process.exit(result.status);
