#!/usr/bin/env node

import oclif from '@oclif/core';

const project = new URL('../tsconfig.json', import.meta.url).pathname;

// In dev mode -> use ts-node and dev plugins
process.env.NODE_ENV = 'development';

import tsnode from 'ts-node';
tsnode.register({ project });

// In dev mode, always show stack traces
oclif.settings.debug = true;

// Start the CLI
oclif
  .run(process.argv.slice(2), { root: new URL('../', import.meta.url).pathname })
  .then(oclif.flush)
  .catch(oclif.Errors.handle);
