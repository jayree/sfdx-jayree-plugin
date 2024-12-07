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
* [`sfdx jayree flow get coverage`](#sfdx-jayree-flow-get-coverage)
* [`sfdx jayree manifest cleanup`](#sfdx-jayree-manifest-cleanup)
* [`sfdx jayree manifest generate`](#sfdx-jayree-manifest-generate)
* [`sfdx jayree manifest git diff REF1 [REF2]`](#sfdx-jayree-manifest-git-diff-ref1-ref2)
* [`sfdx jayree org configure`](#sfdx-jayree-org-configure)
* [`sfdx jayree org configure country`](#sfdx-jayree-org-configure-country)
* [`sfdx jayree org configure state`](#sfdx-jayree-org-configure-state)
* [`sfdx jayree org get settings`](#sfdx-jayree-org-get-settings)
* [`sfdx jayree org stream`](#sfdx-jayree-org-stream)
* [`sfdx jayree project compare snapshot`](#sfdx-jayree-project-compare-snapshot)
* [`sfdx jayree project fix`](#sfdx-jayree-project-fix)
* [`sfdx jayree project generate snapshot`](#sfdx-jayree-project-generate-snapshot)
* [`sfdx jayree project list tracking`](#sfdx-jayree-project-list-tracking)
* [`sfdx jayree project store tracking get`](#sfdx-jayree-project-store-tracking-get)
* [`sfdx jayree project store tracking set`](#sfdx-jayree-project-store-tracking-set)

### `sfdx jayree flow get coverage`

Check the flow test coverage of an Org.

```
USAGE
  $ sfdx jayree flow get coverage -o <value> [--json] [--flags-dir <value>] [--api-version <value>]

FLAGS
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

ALIASES
  $ sfdx jayree flowtestcoverage

EXAMPLES
  $ sfdx jayree:flowtestcoverage
  === Flow Test Coverage
  Coverage: 82%
  ...
```

_See code: [@jayree/sfdx-plugin-org](https://github.com/jayree/sfdx-plugin-org/blob/v1.2.84/src/commands/jayree/flow/get/coverage.ts)_

### `sfdx jayree manifest cleanup`

Removes those tags from a manifest file that are present in a second manifest file.

```
USAGE
  $ sfdx jayree manifest cleanup -f <value> [--json] [--flags-dir <value>] [-x <value>]

FLAGS
  -f, --file=<value>      (required) Path to the second 'cleanup' manifest file.
  -x, --manifest=<value>  Path to the manifest file.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Removes those tags from a manifest file that are present in a second manifest file.

  Use this command to remove components or metadata types from a manifes file.

  If the 'cleanup' manifest file (--file) doesn't exist, a template file is created, which can then be modified.

EXAMPLES
  $ sfdx jayree manifest cleanup --manifest=package.xml --file=packageignore.xml
```

_See code: [@jayree/sfdx-plugin-manifest](https://github.com/jayree/sfdx-plugin-manifest/blob/v3.6.16/src/commands/jayree/manifest/cleanup.ts)_

### `sfdx jayree manifest generate`

Generate a complete manifest file form the specified org.

```
USAGE
  $ sfdx jayree manifest generate -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-q <value>...] [-c] [-w]
    [--include-flow-versions] [-f <value>] [--exclude-managed | --exclude-all]

FLAGS
  -c, --match-case               Enable 'match case' for the quickfilter.
  -f, --file=<value>             Write to 'file' instead of stdout.
  -o, --target-org=<value>       (required) Username or alias of the target org. Not required if the `target-org`
                                 configuration variable is already set.
  -q, --quick-filter=<value>...  Metadata type, member or file path to filter on.
  -w, --match-whole-word         Enable 'match whole word' for the quickfilter.
      --api-version=<value>      Override the api version used for api requests made by this command
      --exclude-all              Exclude all packages from output.
      --exclude-managed          Exclude managed packages from output.
      --include-flow-versions    Include flow versions as with api version 43.0.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Generate a complete manifest file form the specified org.

  Use this command to generate a manifest file based on an existing org.

EXAMPLES
  $ sfdx jayree manifest generate --targetusername myOrg@example.com
  <?xml version='1.0' encoding='UTF-8'?>
  <Package xmlns='http://soap.sforce.com/2006/04/metadata'>...</Package>
```

_See code: [@jayree/sfdx-plugin-manifest](https://github.com/jayree/sfdx-plugin-manifest/blob/v3.6.16/src/commands/jayree/manifest/generate.ts)_

### `sfdx jayree manifest git diff REF1 [REF2]`

Create a project manifest and destructiveChanges manifest that lists the metadata components you want to deploy or delete based on changes in your git history.

```
USAGE
  $ sfdx jayree manifest git diff REF1 [REF2] [--json] [--flags-dir <value>] [--api-version <value>] [-d <value>...]
    [--output-dir <value>] [--destructive-changes-only]

ARGUMENTS
  REF1  Base commit or branch.
  REF2  Commit or branch to compare to the base commit.

FLAGS
  -d, --source-dir=<value>...     Path to the local source files to include in the manifest.
      --api-version=<value>       Override the api version used for api requests made by this command
      --destructive-changes-only  Create a destructiveChanges manifest only.
      --output-dir=<value>        Directory to save the created manifest files.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Create a project manifest and destructiveChanges manifest that lists the metadata components you want to deploy or
  delete based on changes in your git history.

  Use this command to create a manifest and destructiveChanges manifest file based on the difference (git diff) of two
  git refs.

  You can use all ways to spell <commit> which are valid for 'git diff' (See https://git-scm.com/docs/git-diff).

ALIASES
  $ sfdx jayree manifest beta git diff

EXAMPLES
  Uses the changes between two arbitrary <commit>.

    $ sfdx jayree manifest git diff <commit> <commit>
    $ sfdx jayree manifest git diff <commit>..<commit>

  Uses the changes on the branch containing and up to the second <commit>, starting at a common ancestor of both
  <commit>.

    $ sfdx jayree manifest git diff <commit>...<commit>

  Uses the diff of what is unique in branchB (REF2) and unique in branchA (REF1).

    $ sfdx jayree manifest git diff branchA..branchB

  Uses the diff of what is unique in branchB (REF2).

    $ sfdx jayree manifest git diff branchA...branchB

  Specify the flags before or after the REF args

    $ sfdx jayree manifest git diff --output-dir package <commit> <commit>
    $ sfdx jayree manifest git diff <commit> <commit> --output-dir package

  If you specify the 'source-dir' flag before the REF args, use '--' to separate the args from the 'source-dir'
  values.

    $ sfdx jayree manifest git diff --source-dir force-app -- <commit> <commit>

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

_See code: [@jayree/sfdx-plugin-manifest](https://github.com/jayree/sfdx-plugin-manifest/blob/v3.6.16/src/commands/jayree/manifest/git/diff.ts)_

### `sfdx jayree org configure`

Make configuration changes that are not covered by the metadata API.

```
USAGE
  $ sfdx jayree org configure -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-t <value>...]
    [--concurrent]

FLAGS
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
  -t, --tasks=<value>...     Task name(s) listed in sfdx-project.json, if no tasks are specified, all tasks marked as
                             active will be executed.
      --api-version=<value>  Override the api version used for api requests made by this command
      --concurrent           Execute tasks in parallel.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

EXAMPLES
  $ sfdx jayree:org:configure
  $ sfdx jayree:org:configure -u me@my.org
  $ sfdx jayree:org:configure --tasks="Asset Settings","Activity Settings"
  $ sfdx jayree:org:configure --concurrent --tasks="Asset Settings","Activity Settings"
```

_See code: [@jayree/sfdx-plugin-org](https://github.com/jayree/sfdx-plugin-org/blob/v1.2.84/src/commands/jayree/org/configure/index.ts)_

### `sfdx jayree org configure country`

update country integration values in the State/Country Picklists

```
USAGE
  $ sfdx jayree org configure country -o <value> [--json] [--flags-dir <value>] [--api-version <value>]

FLAGS
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.
```

_See code: [@jayree/sfdx-plugin-org](https://github.com/jayree/sfdx-plugin-org/blob/v1.2.84/src/commands/jayree/org/configure/country.ts)_

### `sfdx jayree org configure state`

import (create/update) states into the State/Country Picklists

```
USAGE
  $ sfdx jayree org configure state -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [--country-code <value>]
    [--category <value>] [--language <value>] [--concurrent <value>]

FLAGS
  -o, --target-org=<value>    (required) Username or alias of the target org. Not required if the `target-org`
                              configuration variable is already set.
      --api-version=<value>   Override the api version used for api requests made by this command
      --category=<value>      Subdivision category.
      --concurrent=<value>    [default: 1] execute tasks in parallel.
      --country-code=<value>  Alpha-2 code.
      --language=<value>      Language code.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.
```

_See code: [@jayree/sfdx-plugin-org](https://github.com/jayree/sfdx-plugin-org/blob/v1.2.84/src/commands/jayree/org/configure/state.ts)_

### `sfdx jayree org get settings`

Write the current settings from an Org to a scratch org def file.

```
USAGE
  $ sfdx jayree org get settings -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-w] [-f <value>]

FLAGS
  -f, --file=<value>                  Write to 'file' instead of project-scratch-def.json.
  -o, --target-org=<value>            (required) Username or alias of the target org. Not required if the `target-org`
                                      configuration variable is already set.
  -w, --writetoprojectscratchdeffile  Write output to project-scratch-def.json file.
      --api-version=<value>           Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

ALIASES
  $ sfdx jayree org settings

EXAMPLES
  $ sfdx jayree:org:settings
  $ sfdx jayree:org:settings -u me@my.org
  $ sfdx jayree:org:settings -u MyTestOrg1 -w
```

_See code: [@jayree/sfdx-plugin-org](https://github.com/jayree/sfdx-plugin-org/blob/v1.2.84/src/commands/jayree/org/get/settings.ts)_

### `sfdx jayree org stream`

Listen to streaming api and platform events.

```
USAGE
  $ sfdx jayree org stream -o <value> -c <value> [--json] [--flags-dir <value>] [--api-version <value>] [-r <value>]

FLAGS
  -c, --channel=<value>      (required) The event name.
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
  -r, --replay-id=<value>    Receive all stored events after the event specified by the replayId value and new events.
                             [default: -1] Receive new events that are broadcast after the command subscribes. [-2]
                             Receive all event, including past events that are within the retention window and new
                             events.
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

ALIASES
  $ sfdx jayree org streaming

EXAMPLES
  $ sfdx jayree org stream --channel=/event/eventName__e
  ...
```

_See code: [@jayree/sfdx-plugin-org](https://github.com/jayree/sfdx-plugin-org/blob/v1.2.84/src/commands/jayree/org/stream.ts)_

### `sfdx jayree project compare snapshot`

Compare sfdx source snapshot files.

```
USAGE
  $ sfdx jayree project compare snapshot [--json] [--flags-dir <value>] [--filepath <value>]

FLAGS
  --filepath=<value>  [default: ./sfdx-source-snapshot.json] Path of the generated snapshot file.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

ALIASES
  $ sfdx jayree source snapshot compare
```

_See code: [@jayree/sfdx-plugin-source](https://github.com/jayree/sfdx-plugin-source/blob/v1.3.88/src/commands/jayree/project/compare/snapshot.ts)_

### `sfdx jayree project fix`

Fix retrieved metadata.

```
USAGE
  $ sfdx jayree project fix [--json] [--flags-dir <value>] [-o <value>] [-t <value>...]

FLAGS
  -o, --target-org=<value>  Username or alias of the target org.
  -t, --task=<value>...     Task name(s) listed in sfdx-project.json.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

ALIASES
  $ sfdx jayree source fix
```

_See code: [@jayree/sfdx-plugin-source](https://github.com/jayree/sfdx-plugin-source/blob/v1.3.88/src/commands/jayree/project/fix.ts)_

### `sfdx jayree project generate snapshot`

Generate sfdx source snapshot files.

```
USAGE
  $ sfdx jayree project generate snapshot [--json] [--flags-dir <value>] [--filepath <value>]

FLAGS
  --filepath=<value>  [default: ./sfdx-source-snapshot.json] Path to save the generated snapshot file.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

ALIASES
  $ sfdx jayree source snapshot generate
```

_See code: [@jayree/sfdx-plugin-source](https://github.com/jayree/sfdx-plugin-source/blob/v1.3.88/src/commands/jayree/project/generate/snapshot.ts)_

### `sfdx jayree project list tracking`

List changes in a scratch org by remote revision counter number.

```
USAGE
  $ sfdx jayree project list tracking -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-r <value>]

FLAGS
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
  -r, --revision=<value>     Start at a specific revision counter number.
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

ALIASES
  $ sfdx jayree source tracking list

EXAMPLES
  $ sfdx jayree:source:tracking:list
  $ sfdx jayree:source:tracking:list -u me@my.org
  $ sfdx jayree:source:tracking:list -u me@my.org -r 101
```

_See code: [@jayree/sfdx-plugin-source](https://github.com/jayree/sfdx-plugin-source/blob/v1.3.88/src/commands/jayree/project/list/tracking.ts)_

### `sfdx jayree project store tracking get`

Get stored revision counter number.

```
USAGE
  $ sfdx jayree project store tracking get -o <value> [--json] [--flags-dir <value>]

FLAGS
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

ALIASES
  $ sfdx jayree source tracking store get

EXAMPLES
  $ sfdx jayree:source:tracking:store:get
  $ sfdx jayree:source:tracking:store:get -u me@my.org
```

_See code: [@jayree/sfdx-plugin-source](https://github.com/jayree/sfdx-plugin-source/blob/v1.3.88/src/commands/jayree/project/store/tracking/get.ts)_

### `sfdx jayree project store tracking set`

Store revision counter number.

```
USAGE
  $ sfdx jayree project store tracking set -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-r
  <value>]

FLAGS
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
  -r, --revision=<value>     Revision counter number (default: remote revision counter number).
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

ALIASES
  $ sfdx jayree source tracking store set

EXAMPLES
  $ sfdx jayree:source:tracking:store:set
  $ sfdx jayree:source:tracking:store:set -u me@my.org
  $ sfdx jayree:source:tracking:store:set -u MyTestOrg1 -r 101
```

_See code: [@jayree/sfdx-plugin-source](https://github.com/jayree/sfdx-plugin-source/blob/v1.3.88/src/commands/jayree/project/store/tracking/set.ts)_
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
