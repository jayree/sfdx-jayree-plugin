#!/usr/bin/env node
'use strict';
process.exit(process.env.SFDX_BINPATH || process.env.SFDX_UPDATE_INSTRUCTIONS ? 0 : 1);
