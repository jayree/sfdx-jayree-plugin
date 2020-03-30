# sfdx-jayree

some sfdx commands

[![sfdx](https://img.shields.io/badge/cli-sfdx-brightgreen.svg)](https://developer.salesforce.com/tools/sfdxcli)
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

## Usage

<!-- usage -->
```sh-session
$ sfdx plugins:install sfdx-jayree
$ sfdx jayree:COMMAND
running command...
$ sfdx plugins
sfdx-jayree 1.9.5
$ sfdx help jayree:COMMAND
USAGE
  $ sfdx jayree:COMMAND
...
```
<!-- usagestop -->

## Commands

<!-- commands -->
* [`sfdx jayree:automation:changeset:deploy [-r <string> -l <string>] [-c] [--nodialog -s <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreeautomationchangesetdeploy--r-string--l-string--c---nodialog--s-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:automation:changeset:list [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreeautomationchangesetlist--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:automation:ltngsync:status -o <string> [-s] [-w <integer>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreeautomationltngsyncstatus--o-string--s--w-integer--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:automation:statecountry:import --countrycode <string> --category <string> --language <string> [--uselocalvariant] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreeautomationstatecountryimport---countrycode-string---category-string---language-string---uselocalvariant--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:flowtestcoverage [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreeflowtestcoverage--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:manifest:cleanup [-x <filepath>] [-f <filepath>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreemanifestcleanup--x-filepath--f-filepath--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:manifest:generate [--configfile <string>] [-q <string>] [-c] [-w] [--includeflowversions] [-f <string>] [-x] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreemanifestgenerate---configfile-string--q-string--c--w---includeflowversions--f-string--x--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:org:open [-b <string>] [-p <string>] [-r] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreeorgopen--b-string--p-string--r--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:org:streaming -p <string> [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreeorgstreaming--p-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:packagedescription:create (-d <string> -f <string>) [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreepackagedescriptioncreate--d-string--f-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:packagedescription:get -f <string> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreepackagedescriptionget--f-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:packagedescription:remove -f <string> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreepackagedescriptionremove--f-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:packagedescription:set (-d <string> -f <string>) [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreepackagedescriptionset--d-string--f-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:scratchorg:revision [-b | -r] [-v <integer> -s] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreescratchorgrevision--b---r--v-integer--s--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:scratchorg:settings [-w] [-f <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreescratchorgsettings--w--f-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:source:fix [-t <array>] [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreesourcefix--t-array--u-string---apiversion-string---verbose---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:source:retrieve:all [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreesourceretrieveall--u-string---apiversion-string---verbose---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx jayree:source:retrieve:full [-m <array>] [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-jayreesourceretrievefull--m-array--u-string---apiversion-string---verbose---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

### `sfdx jayree:automation:changeset:deploy [-r <string> -l <string>] [-c] [--nodialog -s <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

deploy incomming change set to an org (beta)

```
USAGE
  $ sfdx jayree:automation:changeset:deploy [-r <string> -l <string>] [-c] [--nodialog -s <string>] [-u <string>] 
  [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --checkonly                                                                   validate deploy but don’t save to
                                                                                    the org (default:false)

  -l, --testlevel=Default|RunSpecifiedTests|RunLocalTests|RunAllTestsInOrg          deployment testing level
                                                                                    (Default,RunSpecifiedTests,RunLocalT
                                                                                    ests,RunAllTestsInOrg)

  -r, --runtests=runtests                                                           tests to run if --testlevel
                                                                                    RunSpecifiedTests

  -s, --changeset=changeset                                                         name of changeset to deploy

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

  --nodialog                                                                        don't show the dialog wizard

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

_See code: [src/commands/jayree/automation/changeset/deploy.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/automation/changeset/deploy.ts)_

### `sfdx jayree:automation:changeset:list [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

list incomming change sets of an org (beta)

```
USAGE
  $ sfdx jayree:automation:changeset:list [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation
```

_See code: [src/commands/jayree/automation/changeset/list.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/automation/changeset/list.ts)_

### `sfdx jayree:automation:ltngsync:status -o <string> [-s] [-w <integer>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

check the Lightning Sync User Sync Status and reset sync if needed (beta)

```
USAGE
  $ sfdx jayree:automation:ltngsync:status -o <string> [-s] [-w <integer>] [-u <string>] [--apiversion <string>] 
  [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -o, --officeuser=officeuser                                                       (required) 'name' (firstname
                                                                                    lastname) of the SF user

  -s, --statusonly                                                                  get Lightning Sync status of the SF
                                                                                    user, only

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  -w, --wait=wait                                                                   wait time for command to wait for
                                                                                    status change in minutes (default:
                                                                                    infinitely)

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx jayree:automation:ltngsync:status -o 'Name'
       configSetup: User assigned to active Lightning Sync configuration... Yes
       userContacts/userEvents: Salesforce and Exchange email addresses linked... Linked/Linked
       userContacts/userEvents: Salesforce to Exchange sync status... Initial sync completed/Initial sync completed
       userContacts/userEvents: Exchange to Salesforce sync status... Initial sync completed/Initial sync completed
```

_See code: [src/commands/jayree/automation/ltngsync/status.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/automation/ltngsync/status.ts)_

### `sfdx jayree:automation:statecountry:import --countrycode <string> --category <string> --language <string> [--uselocalvariant] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

import (create/update) State/Country Picklists (beta)

```
USAGE
  $ sfdx jayree:automation:statecountry:import --countrycode <string> --category <string> --language <string> 
  [--uselocalvariant] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --category=category                                                               (required) Subdivision category

  --countrycode=countrycode                                                         (required) Alpha-2 code

  --json                                                                            format output as json

  --language=language                                                               (required) Language code

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

  --uselocalvariant                                                                 Use Local variant? (default:false)

ALIASES
  $ sfdx jayree:automation:statecountry:create
  $ sfdx jayree:automation:statecountry:update
```

_See code: [src/commands/jayree/automation/statecountry/import.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/automation/statecountry/import.ts)_

### `sfdx jayree:flowtestcoverage [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

check the flow test coverage of an org

```
USAGE
  $ sfdx jayree:flowtestcoverage [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx jayree:flowtestcoverage
  === Flow Test Coverage
  Coverage: 82%
  ...
```

_See code: [src/commands/jayree/flowtestcoverage.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/flowtestcoverage.ts)_

### `sfdx jayree:manifest:cleanup [-x <filepath>] [-f <filepath>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

removes those tags from a manifest file that are present in a second manifest file

```
USAGE
  $ sfdx jayree:manifest:cleanup [-x <filepath>] [-f <filepath>] [-u <string>] [--apiversion <string>] [--json] 
  [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -f, --file=file                                                                   path to the second manifest file

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  -x, --manifest=manifest                                                           path to the manifest file

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation
```

_See code: [src/commands/jayree/manifest/cleanup.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/manifest/cleanup.ts)_

### `sfdx jayree:manifest:generate [--configfile <string>] [-q <string>] [-c] [-w] [--includeflowversions] [-f <string>] [-x] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

generate a complete package xml form the specified org

```
USAGE
  $ sfdx jayree:manifest:generate [--configfile <string>] [-q <string>] [-c] [-w] [--includeflowversions] [-f <string>] 
  [-x] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --matchcase                                                                   enable 'match case' for the
                                                                                    quickfilter

  -f, --file=file                                                                   write to 'file' instead of stdout

  -q, --quickfilter=quickfilter                                                     csv separated list of metadata type,
                                                                                    member or file names to filter on

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  -w, --matchwholeword                                                              enable 'match whole word' for the
                                                                                    quickfilter

  -x, --excludemanaged                                                              exclude managed packages from output

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --configfile=configfile                                                           path to config file

  --includeflowversions                                                             include flow versions as with api
                                                                                    version 43.0

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

ALIASES
  $ sfdx jayree:packagexml

EXAMPLE
  $ sfdx jayree:manifest:generate --targetusername myOrg@example.com
       <?xml version="1.0" encoding="UTF-8"?>
       <Package xmlns="http://soap.sforce.com/2006/04/metadata">...</Package>
```

_See code: [src/commands/jayree/manifest/generate.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/manifest/generate.ts)_

### `sfdx jayree:org:open [-b <string>] [-p <string>] [-r] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

open an org in your preferred browser

```
USAGE
  $ sfdx jayree:org:open [-b <string>] [-p <string>] [-r] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -b, --browser=firefox|chrome|safari                                               [default: chrome] browser to be
                                                                                    launched

  -p, --path=path                                                                   navigation URL path

  -r, --urlonly                                                                     display navigation URL, but don’t
                                                                                    launch browser

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx jayree:org:open
  $ sfdx jayree:org:open -u me@my.org
  $ sfdx jayree:org:open -u MyTestOrg1 -b firefox
  $ sfdx jayree:org:open -r -p lightning -b safari
  $ sfdx jayree:org:open -u me@my.org
```

_See code: [src/commands/jayree/org/open.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/org/open.ts)_

### `sfdx jayree:org:streaming -p <string> [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

listen to streaming api and platform events

```
USAGE
  $ sfdx jayree:org:streaming -p <string> [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -p, --topic=topic                                                                 (required) topic name

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx jayree:streaming --topic=/event/eventName__e
  ...
```

_See code: [src/commands/jayree/org/streaming.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/org/streaming.ts)_

### `sfdx jayree:packagedescription:create (-d <string> -f <string>) [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

creates an empty package with the description

```
USAGE
  $ sfdx jayree:packagedescription:create (-d <string> -f <string>) [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -d, --description=description                                                     (required) new description value
  -f, --file=file                                                                   (required) file to create
  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx jayree:packagedescription:create --file FILENAME --description 'DESCRIPTION'
```

_See code: [src/commands/jayree/packagedescription/create.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/packagedescription/create.ts)_

### `sfdx jayree:packagedescription:get -f <string> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

get the description within a package

```
USAGE
  $ sfdx jayree:packagedescription:get -f <string> [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -f, --file=file                                                                   (required) file to read
  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx jayree:packagedescription:get --file FILENAME
       Description of Package FILENAME
```

_See code: [src/commands/jayree/packagedescription/get.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/packagedescription/get.ts)_

### `sfdx jayree:packagedescription:remove -f <string> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

remove the description within a package

```
USAGE
  $ sfdx jayree:packagedescription:remove -f <string> [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -f, --file=file                                                                   (required) file to read
  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx jayree:packagedescription:remove --file FILENAME
```

_See code: [src/commands/jayree/packagedescription/remove.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/packagedescription/remove.ts)_

### `sfdx jayree:packagedescription:set (-d <string> -f <string>) [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

set the description within a package

```
USAGE
  $ sfdx jayree:packagedescription:set (-d <string> -f <string>) [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -d, --description=description                                                     (required) new description value
  -f, --file=file                                                                   (required) file to read
  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx jayree:packagedescription:set --file FILENAME --description 'NEW DESCRIPTION'
```

_See code: [src/commands/jayree/packagedescription/set.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/packagedescription/set.ts)_

### `sfdx jayree:scratchorg:revision [-b | -r] [-v <integer> -s] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

list changes in a scratch org by remote RevisionNum and set local maxrevision

```
USAGE
  $ sfdx jayree:scratchorg:revision [-b | -r] [-v <integer> -s] [-u <string>] [--apiversion <string>] [--json] 
  [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -b, --storerevision                                                               store maxrevision value
  -r, --restorerevision                                                             restore maxrevision value

  -s, --setlocalmaxrevision                                                         set local maxrevision (default:
                                                                                    remote maxrevision)

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  -v, --localrevisionvalue=localrevisionvalue                                       set local maxrevision value

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx jayree:scratchorgrevision
  $ sfdx jayree:scratchorgrevision -u me@my.org
  $ sfdx jayree:scratchorgrevision -u MyTestOrg1 -w
```

_See code: [src/commands/jayree/scratchorg/revision.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/scratchorg/revision.ts)_

### `sfdx jayree:scratchorg:settings [-w] [-f <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

write the current settings from an Org to a scratch org def file

```
USAGE
  $ sfdx jayree:scratchorg:settings [-w] [-f <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -f, --file=file                                                                   write to 'file' instead of
                                                                                    project-scratch-def.json

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  -w, --writetoprojectscratchdeffile                                                write output to
                                                                                    project-scratch-def.json file

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx jayree:scratchorgsettings
  $ sfdx jayree:scratchorgsettings -u me@my.org
  $ sfdx jayree:scratchorgsettings -u MyTestOrg1 -w
```

_See code: [src/commands/jayree/scratchorg/settings.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/scratchorg/settings.ts)_

### `sfdx jayree:source:fix [-t <array>] [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

fix local source files

```
USAGE
  $ sfdx jayree:source:fix [-t <array>] [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -t, --tag=tag                                                                     comma-separated list of tag names
                                                                                    listed in .sfdx-jayree.json

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

  --verbose                                                                         log output to console

DESCRIPTION
  (examples will follow)
```

_See code: [src/commands/jayree/source/fix.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/source/fix.ts)_

### `sfdx jayree:source:retrieve:all [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

retrieve all sources from an org

```
USAGE
  $ sfdx jayree:source:retrieve:all [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

  --verbose                                                                         log output to console

DESCRIPTION
  Retrieves all metadata in source format from an org to your local Salesforce DX project.
```

_See code: [src/commands/jayree/source/retrieve/all.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/source/retrieve/all.ts)_

### `sfdx jayree:source:retrieve:full [-m <array>] [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

retrieve full sources from an org

```
USAGE
  $ sfdx jayree:source:retrieve:full [-m <array>] [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -m, --metadata=metadata                                                           [default:
                                                                                    Profile,PermissionSet,CustomLabels]
                                                                                    comma-separated list of metadata
                                                                                    component names

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

  --verbose                                                                         log output to console

DESCRIPTION
  Retrieves full profile, permission set and custom label metadata in source format from an org to your local Salesforce 
  DX project.
```

_See code: [src/commands/jayree/source/retrieve/full.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v1.9.5/src/commands/jayree/source/retrieve/full.ts)_
<!-- commandsstop -->
