#!/usr/bin/env node

import * as chalk from 'chalk';
import * as shell from 'shelljs';

shell.set('-e');
shell.set('+v');

process.env.FORCE_COLOR = '1';

function exec(command) {
  console.log(chalk['blue'](command));
  try {
    shell.exec(command);
  } catch (err) {
    console.error(chalk['red'](err.message));
    process.exitCode = 1;
  }
}

if (shell.test('-e', 'src')) {
  exec('yarn build');
}
