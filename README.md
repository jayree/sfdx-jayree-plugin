# sfdx-jayree

A Salesforce CLI plugin containing commands and hooks for Salesforce Application Lifecycle Management tasks.

[![sfdx](https://img.shields.io/badge/cli-sfdx-brightgreen.svg)](https://developer.salesforce.com/tools/sfdxcli)
[![Version](https://img.shields.io/npm/v/sfdx-jayree.svg)](https://npmjs.org/package/sfdx-jayree)
[![test-and-release](https://github.com/jayree/sfdx-jayree-plugin/actions/workflows/release.yml/badge.svg)](https://github.com/jayree/sfdx-jayree-plugin/actions/workflows/release.yml)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-jayree.svg)](https://npmjs.org/package/sfdx-jayree)
[![License](https://img.shields.io/npm/l/sfdx-jayree.svg)](https://github.com/jayree/sfdx-jayree-plugin/blob/main/package.json)
[![Gitter](https://badges.gitter.im/sfdx-jayree-plugin/community.svg)](https://gitter.im/sfdx-jayree-plugin/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Install

```bash
sfdx plugins:install @jayree/sfdx-plugin-source
```

## Commands

<!-- commands -->
* [`sfdx jayree:automation:changeset:deploy`](#sfdx-jayreeautomationchangesetdeploy)
* [`sfdx jayree:automation:changeset:list`](#sfdx-jayreeautomationchangesetlist)
* [`sfdx jayree:automation:ltngsync:status`](#sfdx-jayreeautomationltngsyncstatus)
* [`sfdx jayree:flowtestcoverage`](#sfdx-jayreeflowtestcoverage)
* [`sfdx jayree:manifest:cleanup`](#sfdx-jayreemanifestcleanup)
* [`sfdx jayree:manifest:generate`](#sfdx-jayreemanifestgenerate)
* [`sfdx jayree:manifest:git:diff`](#sfdx-jayreemanifestgitdiff)
* [`sfdx jayree:manifest:legacy:git:diff`](#sfdx-jayreemanifestlegacygitdiff)
* [`sfdx jayree:org:configure`](#sfdx-jayreeorgconfigure)
* [`sfdx jayree:org:configure:country`](#sfdx-jayreeorgconfigurecountry)
* [`sfdx jayree:org:configure:state`](#sfdx-jayreeorgconfigurestate)
* [`sfdx jayree:org:settings`](#sfdx-jayreeorgsettings)
* [`sfdx jayree:org:streaming`](#sfdx-jayreeorgstreaming)
* [`sfdx jayree:packagedescription:create`](#sfdx-jayreepackagedescriptioncreate)
* [`sfdx jayree:packagedescription:get`](#sfdx-jayreepackagedescriptionget)
* [`sfdx jayree:packagedescription:remove`](#sfdx-jayreepackagedescriptionremove)
* [`sfdx jayree:packagedescription:set`](#sfdx-jayreepackagedescriptionset)
* [`sfdx jayree:source:fix`](#sfdx-jayreesourcefix)
* [`sfdx jayree:source:snapshot:compare`](#sfdx-jayreesourcesnapshotcompare)
* [`sfdx jayree:source:snapshot:generate`](#sfdx-jayreesourcesnapshotgenerate)
* [`sfdx jayree:source:tracking:list`](#sfdx-jayreesourcetrackinglist)
* [`sfdx jayree:source:tracking:store:get`](#sfdx-jayreesourcetrackingstoreget)
* [`sfdx jayree:source:tracking:store:set`](#sfdx-jayreesourcetrackingstoreset)

### `sfdx jayree:automation:changeset:deploy`

deploy incomming change set to an org (beta)

```
USAGE
  $ sfdx jayree:automation:changeset:deploy [-r <string> -l <string>] [-c] [--nodialog -s <string>] [-u <string>] [--apiversion
    <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

FLAGS
  -c, --checkonly                                                                   validate deploy but don’t save to
                                                                                    the org (default:false)
  -l, --testlevel=<option>                                                          deployment testing level
                                                                                    (Default,RunSpecifiedTests,RunLocalT
                                                                                    ests,RunAllTestsInOrg)
                                                                                    <options: Default|RunSpecifiedTests|
                                                                                    RunLocalTests|RunAllTestsInOrg>
  -r, --runtests=<value>                                                            tests to run if --testlevel
                                                                                    RunSpecifiedTests
  -s, --changeset=<value>                                                           name of changeset to deploy
  -u, --targetusername=<value>                                                      username or alias for the target
                                                                                    org; overrides default target org
  --apiversion=<value>                                                              override the api version used for
                                                                                    api requests made by this command
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation
  --nodialog                                                                        don't show the dialog wizard

DESCRIPTION
  deploy incomming change set to an org (beta)

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

_See code: [@jayree/sfdx-plugin-legacy](https://github.com/jayree/sfdx-plugin-legacy/blob/v1.1.38/src/commands/jayree/automation/changeset/deploy.ts)_

### `sfdx jayree:automation:changeset:list`

list incomming change sets of an org (beta)

```
USAGE
  $ sfdx jayree:automation:changeset:list [-u <string>] [--apiversion <string>] [--json] [--loglevel
    trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

FLAGS
  -u, --targetusername=<value>                                                      username or alias for the target
                                                                                    org; overrides default target org
  --apiversion=<value>                                                              override the api version used for
                                                                                    api requests made by this command
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

DESCRIPTION
  list incomming change sets of an org (beta)
```

_See code: [@jayree/sfdx-plugin-legacy](https://github.com/jayree/sfdx-plugin-legacy/blob/v1.1.38/src/commands/jayree/automation/changeset/list.ts)_

### `sfdx jayree:automation:ltngsync:status`

check the Lightning Sync User Sync Status and reset sync if needed (beta)

```
USAGE
  $ sfdx jayree:automation:ltngsync:status -o <string> [-s] [-w <integer>] [-u <string>] [--apiversion <string>] [--json] [--loglevel
    trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

FLAGS
  -o, --officeuser=<value>                                                          (required) 'name' (firstname
                                                                                    lastname) of the SF user
  -s, --statusonly                                                                  get Lightning Sync status of the SF
                                                                                    user, only
  -u, --targetusername=<value>                                                      username or alias for the target
                                                                                    org; overrides default target org
  -w, --wait=<value>                                                                wait time for command to wait for
                                                                                    status change in minutes (default:
                                                                                    infinitely)
  --apiversion=<value>                                                              override the api version used for
                                                                                    api requests made by this command
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

DESCRIPTION
  check the Lightning Sync User Sync Status and reset sync if needed (beta)

EXAMPLES
  $ sfdx jayree:automation:ltngsync:status -o 'Name'
  configSetup: User assigned to active Lightning Sync configuration... Yes
  userContacts/userEvents: Salesforce and Exchange email addresses linked... Linked/Linked
  userContacts/userEvents: Salesforce to Exchange sync status... Initial sync completed/Initial sync completed
  userContacts/userEvents: Exchange to Salesforce sync status... Initial sync completed/Initial sync completed
```

_See code: [@jayree/sfdx-plugin-legacy](https://github.com/jayree/sfdx-plugin-legacy/blob/v1.1.38/src/commands/jayree/automation/ltngsync/status.ts)_

### `sfdx jayree:flowtestcoverage`

check the flow test coverage of an org

```
USAGE
  $ sfdx jayree:flowtestcoverage -o <value> [--json] [--api-version <value>]

FLAGS
  -o, --target-org=<value>  (required) Username or alias of the target org.
  --api-version=<value>     Override the api version used for api requests made by this command

GLOBAL FLAGS
  --json  Format output as json.

EXAMPLES
  $ sfdx jayree:flowtestcoverage
  === Flow Test Coverage
  Coverage: 82%
  ...
```

_See code: [src/commands/jayree/flowtestcoverage.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v4.7.3/src/commands/jayree/flowtestcoverage.ts)_

### `sfdx jayree:manifest:cleanup`

Removes those tags from a manifest file that are present in a second manifest file.

```
USAGE
  $ sfdx jayree:manifest:cleanup -f <value> [--json] [-x <value>]

FLAGS
  -f, --file=<value>      (required) Path to the second 'cleanup' manifest file.
  -x, --manifest=<value>  Path to the manifest file.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Removes those tags from a manifest file that are present in a second manifest file.

  Use this command to remove components or metadata types from a manifes file.

  If the 'cleanup' manifest file (--file) doesn't exist, a template file is created, which can then be modified.

EXAMPLES
  $ sfdx jayree:manifest:cleanup --manifest=package.xml --file=packageignore.xml
```

_See code: [@jayree/sfdx-plugin-manifest](https://github.com/jayree/sfdx-plugin-manifest/blob/v3.0.16/src/commands/jayree/manifest/cleanup.ts)_

### `sfdx jayree:manifest:generate`

Generate a complete manifest file form the specified org.

```
USAGE
  $ sfdx jayree:manifest:generate -o <value> [--json] [--api-version <value>] [-q <value>] [-c] [-w] [--include-flow-versions]
    [-f <value>] [--exclude-managed | --exclude-all]

FLAGS
  -c, --match-case               Enable 'match case' for the quickfilter.
  -f, --file=<value>             Write to 'file' instead of stdout.
  -o, --target-org=<value>       (required) Username or alias of the target org.
  -q, --quick-filter=<value>...  Metadata type, member or file path to filter on.
  -w, --match-whole-word         Enable 'match whole word' for the quickfilter.
  --api-version=<value>          Override the api version used for api requests made by this command
  --exclude-all                  Exclude all packages from output.
  --exclude-managed              Exclude managed packages from output.
  --include-flow-versions        Include flow versions as with api version 43.0.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Generate a complete manifest file form the specified org.

  Use this command to generate a manifest file based on an existing org.

EXAMPLES
  $ sfdx jayree:manifest:generate --targetusername myOrg@example.com
  <?xml version='1.0' encoding='UTF-8'?>
  <Package xmlns='http://soap.sforce.com/2006/04/metadata'>...</Package>
```

_See code: [@jayree/sfdx-plugin-manifest](https://github.com/jayree/sfdx-plugin-manifest/blob/v3.0.16/src/commands/jayree/manifest/generate.ts)_

### `sfdx jayree:manifest:git:diff`

Create a project manifest and destructiveChanges manifest that lists the metadata components you want to deploy or delete based on changes in your git history.

```
USAGE
  $ sfdx jayree:manifest:git:diff REF1 [REF2] [--json] [--api-version <value>] [-d <value>] [--output-dir <value>]
    [--destructive-changes-only]

ARGUMENTS
  REF1  Base commit or branch.
  REF2  Commit or branch to compare to the base commit.

FLAGS
  -d, --source-dir=<value>...  Path to the local source files to include in the manifest.
  --api-version=<value>        Override the api version used for api requests made by this command
  --destructive-changes-only   Create a destructiveChanges manifest only.
  --output-dir=<value>         Directory to save the created manifest files.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Create a project manifest and destructiveChanges manifest that lists the metadata components you want to deploy or
  delete based on changes in your git history.

  Use this command to create a manifest and destructiveChanges manifest file based on the difference (git diff) of two
  git refs.

  You can use all ways to spell <commit> which are valid for 'git diff' (See https://git-scm.com/docs/git-diff).

ALIASES
  $ sfdx jayree:manifest:beta:git:diff

EXAMPLES
  Uses the changes between two arbitrary <commit>.

    $ sfdx jayree:manifest:git:diff <commit> <commit>
    $ sfdx jayree:manifest:git:diff <commit>..<commit>

  Uses the changes on the branch containing and up to the second <commit>, starting at a common ancestor of both
  <commit>.

    $ sfdx jayree:manifest:git:diff <commit>...<commit>

  Uses the diff of what is unique in branchB (REF2) and unique in branchA (REF1).

    $ sfdx jayree:manifest:git:diff branchA..branchB

  Uses the diff of what is unique in branchB (REF2).

    $ sfdx jayree:manifest:git:diff branchA...branchB

  Specify the flags before or after the REF args

    $ sfdx jayree:manifest:git:diff --output-dir package <commit> <commit>
    $ sfdx jayree:manifest:git:diff <commit> <commit> --output-dir package

  If you specify the 'source-dir' flag before the REF args, use '--' to separate the args from the 'source-dir'
  values.

    $ sfdx jayree:manifest:git:diff --source-dir force-app -- <commit> <commit>

FLAG DESCRIPTIONS
  -d, --source-dir=<value>...  Path to the local source files to include in the manifest.

    The supplied path can be to a single file (in which case the operation is applied to only one file) or to a folder
    (in which case the operation is applied to all metadata types in the directory and its subdirectories).

    You can specify this flag more than once.

  --destructive-changes-only  Create a destructiveChanges manifest only.

    Use this flag to create a 'destructiveChanges.xml' and a blank 'package.xml'.

  --output-dir=<value>  Directory to save the created manifest files.

    The location can be an absolute path or relative to the current working directory.
```

_See code: [@jayree/sfdx-plugin-manifest](https://github.com/jayree/sfdx-plugin-manifest/blob/v3.0.16/src/commands/jayree/manifest/git/diff.ts)_

### `sfdx jayree:manifest:legacy:git:diff`

Create a project manifest and destructiveChanges manifest that lists the metadata components you want to deploy or delete based on changes in your git history.

```
USAGE
  $ sfdx jayree:manifest:legacy:git:diff REF1 [REF2] [--json] [-d <value>] [--output-dir <value>]
  [--destructive-changes-only]

ARGUMENTS
  REF1  Base commit or branch.
  REF2  Commit or branch to compare to the base commit.

FLAGS
  -d, --source-dir=<value>...  Path to the local source files to include in the manifest.
  --destructive-changes-only   Create a destructiveChanges manifest only.
  --output-dir=<value>         Directory to save the created manifest files.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Create a project manifest and destructiveChanges manifest that lists the metadata components you want to deploy or
  delete based on changes in your git history.

  Use this command to create a manifest and destructiveChanges manifest file based on the difference (git diff) of two
  git refs.

  You can use all ways to spell <commit> which are valid for 'git diff' (See https://git-scm.com/docs/git-diff).

EXAMPLES
  Uses the changes between two arbitrary <commit>.

    $ sfdx jayree:manifest:legacy:git:diff <commit> <commit>
    $ sfdx jayree:manifest:legacy:git:diff <commit>..<commit>

  Uses the changes on the branch containing and up to the second <commit>, starting at a common ancestor of both
  <commit>.

    $ sfdx jayree:manifest:legacy:git:diff <commit>...<commit>

  Uses the diff of what is unique in branchB (REF2) and unique in branchA (REF1).

    $ sfdx jayree:manifest:legacy:git:diff branchA..branchB

  Uses the diff of what is unique in branchB (REF2).

    $ sfdx jayree:manifest:legacy:git:diff branchA...branchB

  Specify the flags before or after the REF args

    $ sfdx jayree:manifest:legacy:git:diff --output-dir package <commit> <commit>
    $ sfdx jayree:manifest:legacy:git:diff <commit> <commit> --output-dir package

  If you specify the 'source-dir' flag before the REF args, use '--' to separate the args from the 'source-dir'
  values.

    $ sfdx jayree:manifest:legacy:git:diff --source-dir force-app -- <commit> <commit>

FLAG DESCRIPTIONS
  -d, --source-dir=<value>...  Path to the local source files to include in the manifest.

    The supplied path can be to a single file (in which case the operation is applied to only one file) or to a folder
    (in which case the operation is applied to all metadata types in the directory and its subdirectories).

    You can specify this flag more than once.

  --destructive-changes-only  Create a destructiveChanges manifest only.

    Use this flag to create a 'destructiveChanges.xml' and a blank 'package.xml'.

  --output-dir=<value>  Directory to save the created manifest files.

    The location can be an absolute path or relative to the current working directory.
```

_See code: [@jayree/sfdx-plugin-manifest](https://github.com/jayree/sfdx-plugin-manifest/blob/v3.0.16/src/commands/jayree/manifest/legacy/git/diff.ts)_

### `sfdx jayree:org:configure`

make configuration changes that are not covered by the metadata API

```
USAGE
  $ sfdx jayree:org:configure -o <value> [--json] [--api-version <value>] [-t <value>] [--concurrent]

FLAGS
  -o, --target-org=<value>  (required) Username or alias of the target org.
  -t, --tasks=<value>...    list of task titles, if no tasks are specified, all tasks marked as active will be executed
  --api-version=<value>     Override the api version used for api requests made by this command
  --concurrent              execute tasks in parallel

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  make configuration changes that are not covered by the metadata API
  See example configuration on how to define tasks

  make configuration changes that are not covered by the metadata API
  See example configuration on how to define tasks

EXAMPLES
  $ sfdx jayree:org:configure
  $ sfdx jayree:org:configure -u me@my.org
  $ sfdx jayree:org:configure --tasks="Asset Settings","Activity Settings"
  $ sfdx jayree:org:configure --concurrent --tasks="Asset Settings","Activity Settings"
```

_See code: [@jayree/sfdx-plugin-org](https://github.com/jayree/sfdx-plugin-org/blob/v1.0.3/src/commands/jayree/org/configure/index.ts)_

### `sfdx jayree:org:configure:country`

update country integration values in the State/Country Picklists

```
USAGE
  $ sfdx jayree:org:configure:country -o <value> [--json] [--api-version <value>]

FLAGS
  -o, --target-org=<value>  (required) Username or alias of the target org.
  --api-version=<value>     Override the api version used for api requests made by this command

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  update country integration values in the State/Country Picklists

  update country integration values in the State/Country Picklists
```

_See code: [@jayree/sfdx-plugin-org](https://github.com/jayree/sfdx-plugin-org/blob/v1.0.3/src/commands/jayree/org/configure/country.ts)_

### `sfdx jayree:org:configure:state`

import (create/update) states into the State/Country Picklists

```
USAGE
  $ sfdx jayree:org:configure:state -o <value> [--json] [--api-version <value>] [--country-code <value>] [--category <value>]
    [--language <value>] [--concurrent <value>]

FLAGS
  -o, --target-org=<value>  (required) Username or alias of the target org.
  --api-version=<value>     Override the api version used for api requests made by this command
  --category=<value>        Subdivision category
  --concurrent=<value>      [default: 1] execute tasks in parallel
  --country-code=<value>    Alpha-2 code
  --language=<value>        Language code

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  import (create/update) states into the State/Country Picklists

  import (create/update) states into the State/Country Picklists
```

_See code: [@jayree/sfdx-plugin-org](https://github.com/jayree/sfdx-plugin-org/blob/v1.0.3/src/commands/jayree/org/configure/state.ts)_

### `sfdx jayree:org:settings`

write the current settings from an Org to a scratch org def file

```
USAGE
  $ sfdx jayree:org:settings -o <value> [--json] [-w] [-f <value>]

FLAGS
  -f, --file=<value>                  write to 'file' instead of project-scratch-def.json
  -o, --target-org=<value>            (required) Username or alias of the target org.
  -w, --writetoprojectscratchdeffile  write output to project-scratch-def.json file

GLOBAL FLAGS
  --json  Format output as json.

EXAMPLES
  $ sfdx jayree:org:settings
  $ sfdx jayree:org:settings -u me@my.org
  $ sfdx jayree:org:settings -u MyTestOrg1 -w
```

_See code: [src/commands/jayree/org/settings.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v4.7.3/src/commands/jayree/org/settings.ts)_

### `sfdx jayree:org:streaming`

listen to streaming api and platform events

```
USAGE
  $ sfdx jayree:org:streaming -o <value> -p <value> [--json] [--api-version <value>]

FLAGS
  -o, --target-org=<value>  (required) Username or alias of the target org.
  -p, --topic=<value>       (required) topic name
  --api-version=<value>     Override the api version used for api requests made by this command

GLOBAL FLAGS
  --json  Format output as json.

EXAMPLES
  $ sfdx jayree:org:streaming --topic=/event/eventName__e
  ...
```

_See code: [src/commands/jayree/org/streaming.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v4.7.3/src/commands/jayree/org/streaming.ts)_

### `sfdx jayree:packagedescription:create`

creates an empty package with the description

```
USAGE
  $ sfdx jayree:packagedescription:create (-d <string> -f <string>) [--json] [--loglevel
    trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

FLAGS
  -d, --description=<value>                                                         (required) new description value
  -f, --file=<value>                                                                (required) file to create
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

DESCRIPTION
  creates an empty package with the description

EXAMPLES
  $ sfdx jayree:packagedescription:create --file FILENAME --description 'DESCRIPTION'
```

_See code: [@jayree/sfdx-plugin-legacy](https://github.com/jayree/sfdx-plugin-legacy/blob/v1.1.38/src/commands/jayree/packagedescription/create.ts)_

### `sfdx jayree:packagedescription:get`

get the description within a package

```
USAGE
  $ sfdx jayree:packagedescription:get -f <string> [--json] [--loglevel
    trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

FLAGS
  -f, --file=<value>                                                                (required) file to read
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

DESCRIPTION
  get the description within a package

EXAMPLES
  $ sfdx jayree:packagedescription:get --file FILENAME
  Description of Package FILENAME
```

_See code: [@jayree/sfdx-plugin-legacy](https://github.com/jayree/sfdx-plugin-legacy/blob/v1.1.38/src/commands/jayree/packagedescription/get.ts)_

### `sfdx jayree:packagedescription:remove`

remove the description within a package

```
USAGE
  $ sfdx jayree:packagedescription:remove -f <string> [--json] [--loglevel
    trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

FLAGS
  -f, --file=<value>                                                                (required) file to read
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

DESCRIPTION
  remove the description within a package

EXAMPLES
  $ sfdx jayree:packagedescription:remove --file FILENAME
```

_See code: [@jayree/sfdx-plugin-legacy](https://github.com/jayree/sfdx-plugin-legacy/blob/v1.1.38/src/commands/jayree/packagedescription/remove.ts)_

### `sfdx jayree:packagedescription:set`

set the description within a package

```
USAGE
  $ sfdx jayree:packagedescription:set (-d <string> -f <string>) [--json] [--loglevel
    trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

FLAGS
  -d, --description=<value>                                                         (required) new description value
  -f, --file=<value>                                                                (required) file to read
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

DESCRIPTION
  set the description within a package

EXAMPLES
  $ sfdx jayree:packagedescription:set --file FILENAME --description 'NEW DESCRIPTION'
```

_See code: [@jayree/sfdx-plugin-legacy](https://github.com/jayree/sfdx-plugin-legacy/blob/v1.1.38/src/commands/jayree/packagedescription/set.ts)_

### `sfdx jayree:source:fix`

fix local source files

```
USAGE
  $ sfdx jayree:source:fix [--json] [-o <value>] [-t <value>] [--verbose]

FLAGS
  -o, --target-org=<value>
  -t, --tag=<value>...      comma-separated list of tag names listed in .sfdx-jayree.json
  --verbose                 log output to console

GLOBAL FLAGS
  --json  Format output as json.

FLAG DESCRIPTIONS
  --verbose  log output to console

    log output to console
```

_See code: [src/commands/jayree/source/fix.ts](https://github.com/jayree/sfdx-jayree-plugin/blob/v4.7.3/src/commands/jayree/source/fix.ts)_

### `sfdx jayree:source:snapshot:compare`

compares sfdx source snapshot files

```
USAGE
  $ sfdx jayree:source:snapshot:compare [--json] [--filepath <value>]

FLAGS
  --filepath=<value>  [default: ./sfdx-source-snapshot.json] path of the generated snapshot file

GLOBAL FLAGS
  --json  Format output as json.
```

_See code: [@jayree/sfdx-plugin-source](https://github.com/jayree/sfdx-plugin-source/blob/v1.1.2/src/commands/jayree/source/snapshot/compare.ts)_

### `sfdx jayree:source:snapshot:generate`

generates sfdx source snapshot files

```
USAGE
  $ sfdx jayree:source:snapshot:generate [--json] [--filepath <value>]

FLAGS
  --filepath=<value>  [default: ./sfdx-source-snapshot.json] path to save the generated snapshot file

GLOBAL FLAGS
  --json  Format output as json.
```

_See code: [@jayree/sfdx-plugin-source](https://github.com/jayree/sfdx-plugin-source/blob/v1.1.2/src/commands/jayree/source/snapshot/generate.ts)_

### `sfdx jayree:source:tracking:list`

list changes in a scratch org by remote revision counter number

```
USAGE
  $ sfdx jayree:source:tracking:list -o <value> [--json] [--api-version <value>] [-r <value>]

FLAGS
  -o, --target-org=<value>  (required) Username or alias of the target org.
  -r, --revision=<value>    start at a specific revision counter number
  --api-version=<value>     Override the api version used for api requests made by this command

GLOBAL FLAGS
  --json  Format output as json.

EXAMPLES
  $ sfdx jayree:source:tracking:list
  $ sfdx jayree:source:tracking:list -u me@my.org
  $ sfdx jayree:source:tracking:list -u me@my.org -r 101
```

_See code: [@jayree/sfdx-plugin-source](https://github.com/jayree/sfdx-plugin-source/blob/v1.1.2/src/commands/jayree/source/tracking/list.ts)_

### `sfdx jayree:source:tracking:store:get`

get stored revision counter number

```
USAGE
  $ sfdx jayree:source:tracking:store:get -o <value> [--json]

FLAGS
  -o, --target-org=<value>  (required) Username or alias of the target org.

GLOBAL FLAGS
  --json  Format output as json.

EXAMPLES
  $ sfdx jayree:source:tracking:store:get
  $ sfdx jayree:source:tracking:store:get -u me@my.org
```

_See code: [@jayree/sfdx-plugin-source](https://github.com/jayree/sfdx-plugin-source/blob/v1.1.2/src/commands/jayree/source/tracking/store/get.ts)_

### `sfdx jayree:source:tracking:store:set`

store revision counter number

```
USAGE
  $ sfdx jayree:source:tracking:store:set -o <value> [--json] [--api-version <value>] [-r <value>]

FLAGS
  -o, --target-org=<value>  (required) Username or alias of the target org.
  -r, --revision=<value>    revision counter number (default: remote revision counter number)
  --api-version=<value>     Override the api version used for api requests made by this command

GLOBAL FLAGS
  --json  Format output as json.

EXAMPLES
  $ sfdx jayree:source:tracking:store:set
  $ sfdx jayree:source:tracking:store:set -u me@my.org
  $ sfdx jayree:source:tracking:store:set -u MyTestOrg1 -r 101
```

_See code: [@jayree/sfdx-plugin-source](https://github.com/jayree/sfdx-plugin-source/blob/v1.1.2/src/commands/jayree/source/tracking/store/set.ts)_
<!-- commandsstop -->

## Hooks
### prerun

- Resets source tracking using `force:source:tracking:reset` before executing `force:source:pull` or `project:retrieve:start`.

> **_IMPORTANT:_** This hook will only run if  `SFDX_ENABLE_JAYREE_HOOKS_RESET_BEFORE_PULL=true` is set. It uses the stored `serverMaxRevisionCounter` as revision counter number (see: [`jayree:project:store:tracking:set`](#sfdx-jayreeprojectstoretrackingset)). If the hook doesn't find a stored value it asks if the current *local* revision counter number should be stored and used.

### scopedPreRetrieve

- Disables the `prettierFormat` hook. See [sfdx-plugin-prettier](https://github.com/jayree/sfdx-plugin-prettier) for more details.

### scopedPostRetrieve

- Applies source fixes of the `jayree project fix` command, deletes and moves source files to separate package directories. See the configuration file [sfdx-project.json](https://github.com/jayree/sfdx-plugin-source/blob/main/sfdx-project.json) for examples. Set `"isActive": true`, to apply this fix during `scopedPostRetrieve` hook.

> **_IMPORTANT:_** Since the hook is not able to update the (JSON) output of the command, an additional output is generated. Set the environment variable `SFDX_ENABLE_JAYREE_HOOKS_JSON_OUTPUT=true` and additional comma-separated JSON output will be appended, where the output must be parsed as an array, e.g. ``JSON.parse(`[${stdout}]`)``. See an example below:

```javascript
import execa from "execa";
import { CliUx } from "@oclif/core";

async function run() {
  const { stdout } = await execa("sfdx", [
    "force:source:retrieve",
    "--metadata",
    "Group:*",
    "--json"
  ]);
  const parsedStdout = JSON.parse(`[${stdout}]`);
  CliUx.ux.styledJSON(
    parsedStdout.length > 1
      ? {
          ...parsedStdout[0],
          result: {
            ...parsedStdout[0].result,
            fixedFiles: parsedStdout[1].fixedFiles
          }
        }
      : parsedStdout[0]
  );
}

run();
```

- Calls `prettierFormat` hook. See [sfdx-plugin-prettier](https://github.com/jayree/sfdx-plugin-prettier) for more details.
