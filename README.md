# sfdx-jayree-plugin

Create configuration from an existing salesforce org

[![Version](https://img.shields.io/npm/v/sfdx-jayree-plugin.svg)](https://npmjs.org/package/sfdx-jayree-plugin)
[![CircleCI](https://circleci.com/gh/jayree/sfdx-jayree-plugin/tree/master.svg?style=shield)](https://circleci.com/gh/jayree/sfdx-jayree-plugin/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/jayree/sfdx-jayree-plugin?branch=master&svg=true)](https://ci.appveyor.com/project/jayree/sfdx-jayree-plugin/branch/master)
[![Codecov](https://codecov.io/gh/jayree/sfdx-jayree-plugin/branch/master/graph/badge.svg)](https://codecov.io/gh/jayree/sfdx-jayree-plugin)
[![Greenkeeper](https://badges.greenkeeper.io/jayree/sfdx-jayree-plugin.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/jayree/sfdx-jayree-plugin/badge.svg)](https://snyk.io/test/github/jayree/sfdx-jayree-plugin)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-jayree-plugin.svg)](https://npmjs.org/package/sfdx-jayree-plugin)
[![License](https://img.shields.io/npm/l/sfdx-jayree-plugin.svg)](https://github.com/jayree/sfdx-jayree-plugin/blob/master/package.json)

- [sfdx-jayree-plugin](#sfdx-jayree-plugin)
  - [`sfdx-jayree jayree:packagexml`](#sfdx-jayree-jayreepackagexml)

<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g sfdx-jayree
$ sfdx-jayree COMMAND
running command...
$ sfdx-jayree (-v|--version|version)
sfdx-jayree/0.0.1 darwin-x64 node-v10.9.0
$ sfdx-jayree --help [COMMAND]
USAGE
  $ sfdx-jayree COMMAND
...
```
<!-- usagestop -->
<!-- commands -->

## `sfdx-jayree jayree:packagexml`

Generate a complete package xml form the specified org

```
USAGE
  $ sfdx-jayree jayree:packagexml

OPTIONS
  -c, --config=config                             path to config file
  -q, --quickfilter=quickfilter                   CSV separated list of metadata types to filter on
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  -x, --excludemanaged                            Exclude Managed Packages from output
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx jayree:packagexml --targetusername myOrg@example.com
       <?xml version="1.0" encoding="UTF-8"?>
       <Package xmlns="http://soap.sforce.com/2006/04/metadata">...</Package>
```

_See code: [src/commands/jayree/packagexml.ts](https://github.com/jayree/sfdx-jayree/blob/v0.0.1/src/commands/jayree/packagexml.ts)_
<!-- commandsstop -->
<!-- 
## Debugging your plugin

We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command:

1. Start the inspector
  
    If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch:

    ```sh-session
    $ sfdx hello:org -u myOrg@example.com --dev-suspend
    Debugger listening on ws://127.0.0.1:9229/...
    For help see https://nodejs.org/en/docs/inspector
    ```

    Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:

    ```sh-session
    $ NODE_OPTIONS=--inspect-brk bin/run hello:org -u myOrg@example.com
    Debugger listening on ws://127.0.0.1:9229/...
    For help see https://nodejs.org/en/docs/inspector
    ```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program.
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).

Congrats, you are debugging! -->
