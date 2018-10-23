sfdx-jayree
===========

some sfdx plugins

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/sfdx-jayree.svg)](https://npmjs.org/package/sfdx-jayree)
[![CircleCI](https://circleci.com/gh/jayree/sfdx-jayree-plugin/tree/master.svg?style=shield)](https://circleci.com/gh/jayree/sfdx-jayree-plugin/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/jayree/sfdx-jayree-plugin?branch=master&svg=true)](https://ci.appveyor.com/project/jayree/sfdx-jayree-plugin/branch/master)
[![Codecov](https://codecov.io/gh/jayree/sfdx-jayree-plugin/branch/master/graph/badge.svg)](https://codecov.io/gh/jayree/sfdx-jayree-plugin)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-jayree.svg)](https://npmjs.org/package/sfdx-jayree)
[![License](https://img.shields.io/npm/l/sfdx-jayree.svg)](https://github.com/jayree/sfdx-jayree-plugin/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g sfdx-jayree
$ sfdx-jayree COMMAND
running command...
$ sfdx-jayree (-v|--version|version)
sfdx-jayree/0.1.0 darwin-x64 node-v10.12.0
$ sfdx-jayree --help [COMMAND]
USAGE
  $ sfdx-jayree COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`sfdx-jayree jayree:packagedescription:create [FILE]`](#sfdx-jayree-jayreepackagedescriptioncreate-file)
* [`sfdx-jayree jayree:packagedescription:get [FILE]`](#sfdx-jayree-jayreepackagedescriptionget-file)
* [`sfdx-jayree jayree:packagedescription:remove [FILE]`](#sfdx-jayree-jayreepackagedescriptionremove-file)
* [`sfdx-jayree jayree:packagedescription:set [FILE]`](#sfdx-jayree-jayreepackagedescriptionset-file)
* [`sfdx-jayree jayree:packagexml`](#sfdx-jayree-jayreepackagexml)

## `sfdx-jayree jayree:packagedescription:create [FILE]`

creates an empty package with the description

```
USAGE
  $ sfdx-jayree jayree:packagedescription:create [FILE]

OPTIONS
  -d, --description=description                   (required) new description value
  -f, --file=file                                 (required) file to create
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx jayree:packagedescription:create --file FILENAME --description 'DESCRIPTION'
```

_See code: [src/commands/jayree/packagedescription/create.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v0.1.0/src/commands/jayree/packagedescription/create.ts)_

## `sfdx-jayree jayree:packagedescription:get [FILE]`

get the description within a package

```
USAGE
  $ sfdx-jayree jayree:packagedescription:get [FILE]

OPTIONS
  -f, --file=file                                 (required) file to read
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx jayree:packagedescription:get --file FILENAME
       Description of Package FILENAME
```

_See code: [src/commands/jayree/packagedescription/get.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v0.1.0/src/commands/jayree/packagedescription/get.ts)_

## `sfdx-jayree jayree:packagedescription:remove [FILE]`

remove the description within a package

```
USAGE
  $ sfdx-jayree jayree:packagedescription:remove [FILE]

OPTIONS
  -f, --file=file                                 (required) file to cead
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx jayree:packagedescription:remove --file FILENAME
```

_See code: [src/commands/jayree/packagedescription/remove.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v0.1.0/src/commands/jayree/packagedescription/remove.ts)_

## `sfdx-jayree jayree:packagedescription:set [FILE]`

set the description within a package

```
USAGE
  $ sfdx-jayree jayree:packagedescription:set [FILE]

OPTIONS
  -d, --description=description                   (required) new description value
  -f, --file=file                                 (required) file to cead
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx jayree:packagedescription:set --file FILENAME --description 'NEW DESCRIPTION'
```

_See code: [src/commands/jayree/packagedescription/set.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v0.1.0/src/commands/jayree/packagedescription/set.ts)_

## `sfdx-jayree jayree:packagexml`

generate a complete package xml form the specified org

```
USAGE
  $ sfdx-jayree jayree:packagexml

OPTIONS
  -c, --matchcase                                 enable 'match case' for the quickfilter
  -q, --quickfilter=quickfilter                   csv separated list of metadata type, member or file names to filter on
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  -w, --matchwholeword                            enable 'match whole word' for the quickfilter
  -x, --excludemanaged                            exclude managed packages from output
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --config=config                                 path to config file
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx jayree:packagexml --targetusername myOrg@example.com
       <?xml version="1.0" encoding="UTF-8"?>
       <Package xmlns="http://soap.sforce.com/2006/04/metadata">...</Package>
```

_See code: [src/commands/jayree/packagexml.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v0.1.0/src/commands/jayree/packagexml.ts)_
<!-- commandsstop -->
