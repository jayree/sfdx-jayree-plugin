#!/usr/bin/env node

import oclif from '@oclif/core';

oclif.run().then(import('@oclif/core/flush.js')).catch(import('@oclif/core/handle.js'));
