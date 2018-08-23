sfdx-jayree-plugin
===========

Create configuration from an existing salesforce org

[![Version](https://img.shields.io/npm/v/sfdx-jayree-plugin.svg)](https://npmjs.org/package/sfdx-jayree-plugin)
[![CircleCI](https://circleci.com/gh/jayree/sfdx-jayree-plugin/tree/master.svg?style=shield)](https://circleci.com/gh/jayree/sfdx-jayree-plugin/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/jayree/sfdx-jayree-plugin?branch=master&svg=true)](https://ci.appveyor.com/project/jayree/sfdx-jayree-plugin/branch/master)
[![Codecov](https://codecov.io/gh/jayree/sfdx-jayree-plugin/branch/master/graph/badge.svg)](https://codecov.io/gh/jayree/sfdx-jayree-plugin)
[![Greenkeeper](https://badges.greenkeeper.io/jayree/sfdx-jayree-plugin.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/jayree/sfdx-jayree-plugin/badge.svg)](https://snyk.io/test/github/jayree/sfdx-jayree-plugin)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-jayree-plugin.svg)](https://npmjs.org/package/sfdx-jayree-plugin)
[![License](https://img.shields.io/npm/l/sfdx-jayree-plugin.svg)](https://github.com/jayree/sfdx-jayree-plugin/blob/master/package.json)

<!-- toc -->

<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g sfdx-jayree
$ sfdx-jayree COMMAND
running command...
$ sfdx-jayree (-v|--version|version)
sfdx-jayree/0.0.1 darwin-x64 node-v8.9.4
$ sfdx-jayree --help [COMMAND]
USAGE
  $ sfdx-jayree COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
- [sfdx-jayree-plugin](#sfdx-jayree-plugin)
  - [`sfdx-jayree jayree:packagexml`](#sfdx-jayree-jayreepackagexml)

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
