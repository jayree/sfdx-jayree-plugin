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

// shell.touch('ich_bin_postinstall-zr.txt');
// shell.echo(process.cwd().toString()).to('output_postinstall-zr.txt');
// shell.cat('package.json').to('package-vorher-zr.json');
// shell.cat('oclif.manifest.json').to('oclif.manifest-vorher-zr.json');

if (shell.test('-e', 'src')) {
  // shell.touch('postinstall_src_start-zr.txt');
  exec('yarn patch-package');
  // exec('yarn sfdx-install');
  // shell.touch('postinstall_src_end-zr.txt');
} /*  else {
  shell.touch('postinstall_src_not_start-zr.txt');
  exec('yarn oclif-dev manifest');
  exec('yarn oclif-dev readme');
  shell.touch('postinstall_src_not_end-zr.txt');
} */

/* shell.cat('package.json').to('package-nachher-zr.json');
shell.cat('oclif.manifest.json').to('oclif.manifest-nachher-zr.json'); */
