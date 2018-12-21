<!-- prettier-ignore -->
sfdx-jayree
===========

some sfdx commands

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/sfdx-jayree.svg)](https://npmjs.org/package/sfdx-jayree)
[![CircleCI](https://circleci.com/gh/jayree/sfdx-jayree-plugin.svg?style=shield)](https://circleci.com/gh/jayree/sfdx-jayree-plugin)
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
$ sfdx plugins:install sfdx-jayree
$ sfdx jayree:COMMAND
running command...
$ sfdx plugins
sfdx-jayree 0.4.5
$ sfdx help jayree:COMMAND
USAGE
  $ sfdx jayree:COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`sfdx jayree:automation:changeset:deploy`](#sfdx-jayreeautomationchangesetdeploy)
* [`sfdx jayree:automation:changeset:list`](#sfdx-jayreeautomationchangesetlist)
* [`sfdx jayree:automation:ltngsyncstatus`](#sfdx-jayreeautomationltngsyncstatus)
* [`sfdx jayree:flowtestcoverage`](#sfdx-jayreeflowtestcoverage)
* [`sfdx jayree:org:open`](#sfdx-jayreeorgopen)
* [`sfdx jayree:packagedescription:create [FILE]`](#sfdx-jayreepackagedescriptioncreate-file)
* [`sfdx jayree:packagedescription:get [FILE]`](#sfdx-jayreepackagedescriptionget-file)
* [`sfdx jayree:packagedescription:remove [FILE]`](#sfdx-jayreepackagedescriptionremove-file)
* [`sfdx jayree:packagedescription:set [FILE]`](#sfdx-jayreepackagedescriptionset-file)
* [`sfdx jayree:packagexml [FILE]`](#sfdx-jayreepackagexml-file)

## `sfdx jayree:automation:changeset:deploy`

deploy incomming change set to an org

```
USAGE
  $ sfdx jayree:automation:changeset:deploy

OPTIONS
  -c, --checkonly                                                           validate deploy but don’t save to the org
                                                                            (default:false)

  -l, --testlevel=Default|RunSpecifiedTests|RunLocalTests|RunAllTestsInOrg  deployment testing level
                                                                            (Default,RunSpecifiedTests,RunLocalTests,Run
                                                                            AllTestsInOrg)

  -r, --runtests=runtests                                                   tests to run if --testlevel
                                                                            RunSpecifiedTests

  -s, --changeset=changeset                                                 name of changeset to deploy

  -u, --targetusername=targetusername                                       username or alias for the target org;
                                                                            overrides default target org

  --apiversion=apiversion                                                   override the api version used for api
                                                                            requests made by this command

  --json                                                                    format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)                            logging level for this command invocation

  --nodialog                                                                don't show the dialog wizard

EXAMPLES
  $ sfdx jayree:automation:changeset:deploy -s ChangeSet -l RunLocalTests --nodialog
  Deploying Change Set 'ChangeSet'...

  === Status
  Status: Pending
  jobid:  0Xxx100000xx1x1

  $ sfdx jayree:automation:changeset:deploy
  ? Change Sets Awaiting Deployment (Use arrow keys)
    ChangeSet3
    ChangeSet2
  ❯ ChangeSet1
```

_See code: [src/commands/jayree/automation/changeset/deploy.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v0.4.5/src/commands/jayree/automation/changeset/deploy.ts)_

## `sfdx jayree:automation:changeset:list`

list incomming change sets of an org

```
USAGE
  $ sfdx jayree:automation:changeset:list

OPTIONS
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation
```

_See code: [src/commands/jayree/automation/changeset/list.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v0.4.5/src/commands/jayree/automation/changeset/list.ts)_

## `sfdx jayree:automation:ltngsyncstatus`

check the Lightning Sync User Sync Status and reset sync if needed

```
USAGE
  $ sfdx jayree:automation:ltngsyncstatus

OPTIONS
  -o, --officeuser=officeuser                     'name' (firstname lastname) of the SF user
  -s, --statusonly                                get Lightning Sync status of the SF user, only
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org

  -w, --wait=wait                                 wait time for command to wait for status change in minutes (default:
                                                  infinitely)

  --apiversion=apiversion                         override the api version used for api requests made by this command

  --json                                          format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx jayree:automation:usersyncstatus -o 'Name'
       configSetup: User assigned to active Lightning Sync configuration... Yes
       userContacts/userEvents: Salesforce and Exchange email addresses linked... Linked/Linked
       userContacts/userEvents: Salesforce to Exchange sync status... Initial sync completed/Initial sync completed
       userContacts/userEvents: Exchange to Salesforce sync status... Initial sync completed/Initial sync completed
```

_See code: [src/commands/jayree/automation/ltngsyncstatus.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v0.4.5/src/commands/jayree/automation/ltngsyncstatus.ts)_

## `sfdx jayree:flowtestcoverage`

check the flow test coverage of an org

```
USAGE
  $ sfdx jayree:flowtestcoverage

OPTIONS
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx jayree:flowtestcoverage
  === Flow Test Coverage
  Coverage: 82%
  ...
```

_See code: [src/commands/jayree/flowtestcoverage.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v0.4.5/src/commands/jayree/flowtestcoverage.ts)_

## `sfdx jayree:org:open`

open an org in your preferred browser

```
USAGE
  $ sfdx jayree:org:open

OPTIONS
  -b, --browser=firefox|chrome|safari             [default: chrome] browser to be launched
  -p, --path=path                                 navigation URL path
  -r, --urlonly                                   display navigation URL, but don’t launch browser
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx jayree:org:open
  $ sfdx jayree:org:open -u me@my.org
  $ sfdx jayree:org:open -u MyTestOrg1 -b firefox
  $ sfdx jayree:org:open -r -p lightning -b safari
  $ sfdx jayree:org:open -u me@my.org
```

_See code: [src/commands/jayree/org/open.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v0.4.5/src/commands/jayree/org/open.ts)_

## `sfdx jayree:packagedescription:create [FILE]`

creates an empty package with the description

```
USAGE
  $ sfdx jayree:packagedescription:create [FILE]

OPTIONS
  -d, --description=description                   (required) new description value
  -f, --file=file                                 (required) file to create
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx jayree:packagedescription:create --file FILENAME --description 'DESCRIPTION'
```

_See code: [src/commands/jayree/packagedescription/create.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v0.4.5/src/commands/jayree/packagedescription/create.ts)_

## `sfdx jayree:packagedescription:get [FILE]`

get the description within a package

```
USAGE
  $ sfdx jayree:packagedescription:get [FILE]

OPTIONS
  -f, --file=file                                 (required) file to read
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx jayree:packagedescription:get --file FILENAME
       Description of Package FILENAME
```

_See code: [src/commands/jayree/packagedescription/get.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v0.4.5/src/commands/jayree/packagedescription/get.ts)_

## `sfdx jayree:packagedescription:remove [FILE]`

remove the description within a package

```
USAGE
  $ sfdx jayree:packagedescription:remove [FILE]

OPTIONS
  -f, --file=file                                 (required) file to read
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx jayree:packagedescription:remove --file FILENAME
```

_See code: [src/commands/jayree/packagedescription/remove.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v0.4.5/src/commands/jayree/packagedescription/remove.ts)_

## `sfdx jayree:packagedescription:set [FILE]`

set the description within a package

```
USAGE
  $ sfdx jayree:packagedescription:set [FILE]

OPTIONS
  -d, --description=description                   (required) new description value
  -f, --file=file                                 (required) file to read
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx jayree:packagedescription:set --file FILENAME --description 'NEW DESCRIPTION'
```

_See code: [src/commands/jayree/packagedescription/set.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v0.4.5/src/commands/jayree/packagedescription/set.ts)_

## `sfdx jayree:packagexml [FILE]`

generate a complete package xml form the specified org

```
USAGE
  $ sfdx jayree:packagexml [FILE]

OPTIONS
  -c, --matchcase                                 enable 'match case' for the quickfilter
  -f, --file=file                                 write to 'file' instead of stdout
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

_See code: [src/commands/jayree/packagexml.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v0.4.5/src/commands/jayree/packagexml.ts)_
<!-- commandsstop -->
