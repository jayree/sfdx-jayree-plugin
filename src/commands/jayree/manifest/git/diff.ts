/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join, dirname } from 'path';
import * as util from 'util';
import { SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import { Logger, Listr } from 'listr2';
import * as kit from '@salesforce/kit';
import { ComponentSet, VirtualTreeContainer } from '@salesforce/source-deploy-retrieve';
import {
  getGitResults,
  createVirtualTreeContainer,
  NodeFSTreeContainer,
  buildManifestComponentSet,
  getGitDiff,
  Ctx,
  debug,
  ensureOSPath,
} from '../../../../utils/gitdiff';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('sfdx-jayree', 'gitdiff');

const logger = new Logger({ useIcons: false });

// workaround until listr2 can catch emitWarnings with v4.0
// eslint-disable-next-line @typescript-eslint/unbound-method
const original = process.emitWarning;

process.emitWarning = (warning: string) => {
  process.once('beforeExit', () => {
    return original(warning);
  });
};

const unexpectedArgument = (input) => {
  if (input.includes('-')) {
    throw new Error(`Unexpected argument: ${input}
  See more help with --help`);
  }
  return input;
};

export default class GitDiff extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:manifest:git:diff <commit> <commit>
$ sfdx jayree:manifest:git:diff <commit>..<commit>
uses the changes between two arbitrary <commit>
`,
    `$ sfdx jayree:manifest:git:diff <commit>...<commit>
uses the changes on the branch containing and up to the second <commit>, starting at a common ancestor of both <commit>.
    `,
    `$ sfdx jayree:manifest:git:diff branchA..branchB
uses the diff of what is unique in branchB (REF2) and unique in branchA (REF1)
`,
    `$ sfdx jayree:manifest:git:diff branchA...branchB
uses the diff of what is unique in branchB (REF2)`,
  ];

  public static args = [
    {
      name: 'ref1',
      required: true,
      description: 'base commit or branch',
      parse: unexpectedArgument,
      hidden: false,
    },
    {
      name: 'ref2',
      required: false,
      description: 'commit or branch to compare to the base commit',
      parse: unexpectedArgument,
      hidden: false,
    },
  ];

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = true;

  private isOutputEnabled;

  public async run(): Promise<AnyJson> {
    const isContentTypeJSON = kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
    this.isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);
    const gitArgs = this.getGitArgsFromArgv();

    const tasks = new Listr<Ctx>(
      [
        {
          title: 'Analyze sfdx-project',
          task: async (ctx, task): Promise<void> => {
            ctx.projectRoot = this.project.getPath();
            ctx.sfdxProjectFolders = this.project.getPackageDirectories().map((p) => ensureOSPath(p.path));
            ctx.sourceApiVersion = (await this.project.retrieveSfdxProjectJson()).getContents().sourceApiVersion;
            task.output = `packageDirectories: ${ctx.sfdxProjectFolders.length} sourceApiVersion: ${ctx.sourceApiVersion}`;
          },
          options: { persistentOutput: true },
        },
        {
          title: "Execute 'git --no-pager diff --name-status --no-renames <pending>'",
          task: async (ctx, task): Promise<void> => {
            ctx.git = gitArgs;
            task.title = `Execute 'git --no-pager diff --name-status --no-renames ${ctx.git.ref1ref2}'`;
            ctx.gitLines = await getGitDiff(ctx.sfdxProjectFolders, ctx.git.ref1ref2);
            task.output = `Changed files: ${ctx.gitLines.length}`;
          },
          options: { persistentOutput: true },
        },
        {
          title: 'Create virtual tree container',
          skip: (ctx): boolean => ctx.gitLines.length === 0,
          task: (ctx, task): Listr =>
            task.newListr(
              [
                {
                  title: `ref1: ${ctx.git.ref1}`,
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  task: async (ctx): Promise<void> => {
                    ctx.ref1VirtualTreeContainer = await createVirtualTreeContainer(
                      ctx.git.ref1,
                      ctx.gitLines.filter((l) => l.status === 'M').map((l) => l.path)
                    );
                  },
                },
                {
                  title: ctx.git.ref2 !== '' ? `ref2: ${ctx.git.ref2}` : undefined,
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  task: async (ctx): Promise<void> => {
                    ctx.ref2VirtualTreeContainer =
                      ctx.git.ref2 !== ''
                        ? await createVirtualTreeContainer(
                            ctx.git.ref2,
                            ctx.gitLines.filter((l) => l.status === 'M').map((l) => l.path)
                          )
                        : new NodeFSTreeContainer();
                  },
                },
              ],
              { concurrent: true }
            ),
        },
        {
          title: 'Analyze git diff results',
          skip: (ctx): boolean => ctx.gitLines.length === 0,
          task: async (ctx, task): Promise<void> => {
            ctx.gitResults = await getGitResults(
              ctx.gitLines,
              ctx.ref1VirtualTreeContainer,
              ctx.ref2VirtualTreeContainer
            );
            task.output = `Added: ${ctx.gitResults.counts.added}, Deleted: ${
              ctx.gitResults.counts.deleted
            }, Modified: ${ctx.gitResults.counts.modified}, Unchanged: ${ctx.gitResults.counts.unchanged}, Ignored: ${
              ctx.gitResults.counts.ignored
            }${ctx.gitResults.counts.error ? `, Errors: ${ctx.gitResults.counts.error}` : ''}`;
          },
          options: { persistentOutput: true },
        },
        {
          // title: 'Error output',
          skip: (ctx): boolean => !ctx.gitResults.errors.length,
          task: (ctx, task): void => {
            const errors = [...ctx.gitResults.errors];
            const moreErrors = errors.splice(5);
            for (const message of errors) {
              task.output = `Error: ${message}`;
            }
            task.output = moreErrors.length ? `... ${moreErrors.length} more errors` : '';
          },
          options: { persistentOutput: true, bottomBar: 6 },
        },
        {
          title: 'Generate manifests',
          skip: (ctx): boolean =>
            !ctx.gitResults || (!ctx.gitResults.manifest.size && !ctx.gitResults.destructiveChanges.size),
          task: (ctx, task): Listr =>
            task.newListr(
              [
                {
                  title: join('destructiveChanges', 'destructiveChanges.xml'),
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  skip: (ctx): boolean => !ctx.gitResults.destructiveChanges.size,
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  task: async (ctx, task): Promise<void> => {
                    ctx.destructiveChangesComponentSet = buildManifestComponentSet(
                      ctx.gitResults.destructiveChanges,
                      true
                    );
                    if (!ctx.destructiveChangesComponentSet.getObject(true).Package.types.length) {
                      task.skip();
                      return;
                    }
                    ctx.destructiveChanges = {
                      files: [
                        join(ctx.projectRoot, 'destructiveChanges', 'destructiveChanges.xml'),
                        join(ctx.projectRoot, 'destructiveChanges', 'package.xml'),
                      ],
                    };
                    await fs.ensureDir(dirname(ctx.destructiveChanges.files[0]));
                    await fs.writeFile(
                      ctx.destructiveChanges.files[0],
                      ctx.destructiveChangesComponentSet.getPackageXml(undefined, true)
                    );

                    await fs.writeFile(
                      ctx.destructiveChanges.files[1],
                      ctx.destructiveChangesComponentSet.getPackageXml()
                    );
                  },
                  options: { persistentOutput: true },
                },
                {
                  title: join('package', 'package.xml'),
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  skip: (ctx): boolean => !ctx.gitResults.manifest.size,
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  task: async (ctx, task): Promise<void> => {
                    ctx.manifestComponentSet = buildManifestComponentSet(ctx.gitResults.manifest);
                    if (!ctx.manifestComponentSet.getObject().Package.types.length) {
                      task.skip();
                      return;
                    }
                    ctx.manifest = { file: join(ctx.projectRoot, 'package', 'package.xml') };
                    await fs.ensureDir(dirname(ctx.manifest.file));
                    await fs.writeFile(ctx.manifest.file, ctx.manifestComponentSet.getPackageXml());
                  },
                  options: { persistentOutput: true },
                },
              ],
              { concurrent: true, exitOnError: false }
            ),
        },
      ],
      {
        rendererOptions: { showTimer: true, collapse: false, lazy: true, collapseErrors: false },
        rendererSilent: !this.isOutputEnabled,
        rendererFallback: debug.enabled,
      }
    );

    try {
      const context = await tasks.run();
      if (debug.enabled && this.isOutputEnabled) {
        logger.success(
          `Context: ${JSON.stringify(
            context,
            (key, value) => {
              if (value instanceof ComponentSet && value !== null) {
                let types = value.getObject().Package.types;
                if (types.length === 0) {
                  types = value.getObject(true).Package.types;
                }
                return types;
              }
              if (value instanceof VirtualTreeContainer) {
                return typeof value;
              }
              return value;
            },
            2
          )}`
        );
      }
      return {
        destructiveChanges: context.destructiveChangesComponentSet?.getObject(true),
        manifest: context.manifestComponentSet?.getObject(),
      } as unknown as AnyJson;
    } catch (e) {
      if (debug.enabled && this.isOutputEnabled) {
        logger.fail(e);
      }
      throw e;
    }
  }

  private getGitArgsFromArgv() {
    const argv = this.argv.filter((v) => !v.includes('-'));
    let ref1ref2 = this.args.ref1;
    const a = argv.join('.').split('.');

    if ((a.length === 3 || a.length === 4) && typeof this.args.ref2 === 'undefined') {
      this.args.ref1 = a[0];
      this.args.ref2 = a[a.length - 1];
    } else if (a.length === 2 && typeof this.args.ref2 !== 'undefined') {
      ref1ref2 = `${this.args.ref1}..${this.args.ref2}`;
    } else if (a.length === 1) {
      this.args.ref2 = '';
    } else {
      throw new Error(`Ambiguous ${util.format('argument%s', argv.length === 1 ? '' : 's')}: ${argv.join(', ')}
See more help with --help`);
    }

    return { ref1: this.args.ref1, ref2: this.args.ref2, ref1ref2 };
  }
}
