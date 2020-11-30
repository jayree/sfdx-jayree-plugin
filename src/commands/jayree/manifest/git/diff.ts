/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join } from 'path';
import * as util from 'util';
import { core, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import * as fs from 'fs-extra';
import { Logger, Listr } from 'listr2';
import * as kit from '@salesforce/kit';
import {
  getGitResults,
  prepareTempProject,
  addFilesToTempProject,
  convertTempProject,
  appendToManifest,
  Ctx,
  debug,
} from '../../../../utils/gitdiff';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'gitdiff');

const logger = new Logger({ useIcons: false });

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

  // eslint-disable-next-line @typescript-eslint/require-await
  public async run(): Promise<AnyJson> {
    const isContentTypeJSON = kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
    this.isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);
    const gitArgs = this.getGitArgsFromArgv();

    const tasks: Listr<Ctx> = new Listr<Ctx>(
      [
        {
          // title: 'Prepare',
          task: (ctx): void => {
            ctx.projectRoot = this.project.getPath();
            ctx.git = gitArgs;
            ctx.destructiveChanges = { content: null, files: null };
            ctx.manifest = { content: null, file: null };
            ctx.warnings = {};
          },
          options: { persistentOutput: true },
        },
        {
          title: 'Analyze sfdx-project',
          task: async (ctx, task): Promise<void> => {
            ctx.sfdxProject = JSON.parse((await fs.readFile(join(ctx.projectRoot, 'sfdx-project.json'))).toString());
            ctx.sfdxProjectFolders = ctx.sfdxProject.packageDirectories.map((p) => p.path);
            task.output = `found ${ctx.sfdxProjectFolders.length} package ${util.format(
              'director%s',
              ctx.sfdxProjectFolders.length === 1 ? 'y' : 'ies'
            )}`;
          },
          options: { persistentOutput: true },
        },
        {
          title: 'Analyze git diff ...',
          task: async (ctx, task): Promise<void> => {
            task.title = `Analyze git diff ${ctx.git.ref1ref2}`;
            ctx.gitResults = await getGitResults(task, ctx);
          },
          options: { persistentOutput: true },
        },
        {
          title: `Generate ${join('destructiveChanges', 'destructiveChanges.xml')}`,
          task: (ctx, task): Listr =>
            task.newListr([
              {
                title: 'Prepare temp project',
                // eslint-disable-next-line no-shadow
                task: async (ctx): Promise<void> => {
                  ctx.tmpbasepath = join(ctx.projectRoot, '.sfdx', 'temp', `sdx_sourceGitDiff_${Date.now()}`);

                  process.once('beforeExit', () => {
                    void fs.remove(ctx.tmpbasepath);
                  });

                  process.once('SIGINT', () => {
                    fs.removeSync(ctx.tmpbasepath);
                  });

                  ctx.destructiveChangesProjectPath = await prepareTempProject('destructiveChanges', ctx);
                },
              },
              {
                title: 'Create deleted files in temp project',
                // eslint-disable-next-line no-shadow
                task: async (ctx, task): Promise<void> => {
                  ctx.destructiveChangesSourceFiles = await addFilesToTempProject(
                    ctx.destructiveChangesProjectPath,
                    ctx.gitResults.deleted,
                    task,
                    ctx
                  );
                },
                options: {
                  bottomBar: 5,
                },
              },
              {
                title: 'Generate manifest',
                // eslint-disable-next-line no-shadow
                task: async (ctx, task): Promise<void> => {
                  ctx.destructiveChangesManifestFile = null;
                  if (ctx.destructiveChangesSourceFiles.length > 0) {
                    ctx.destructiveChangesManifestFile = await convertTempProject(
                      ctx.destructiveChangesProjectPath,
                      {
                        destruct: true,
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                      },
                      task,
                      ctx
                    );
                  }
                  if (ctx.destructiveChangesManifestFile === null) {
                    ctx.destructiveChangesManifestFile = join(ctx.destructiveChangesProjectPath, 'package.xml');
                    await fs.writeFile(
                      ctx.destructiveChangesManifestFile,
                      `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
  <version>${ctx.sfdxProject.sourceApiVersion}</version>
</Package>`
                    );
                  }
                },
                options: {
                  bottomBar: 5,
                },
              },
              {
                title: 'Apply changes from modified files to manifest',
                // eslint-disable-next-line no-shadow
                task: async (ctx): Promise<void> => {
                  ctx.destructiveChanges.content = await appendToManifest(
                    ctx.destructiveChangesManifestFile,
                    ctx.gitResults.modified.toDestructiveChanges
                  );
                },
              },
              {
                title: 'Save',
                // eslint-disable-next-line no-shadow
                task: async (ctx): Promise<void> => {
                  ctx.destructiveChanges.files = [
                    join(ctx.projectRoot, 'destructiveChanges', 'destructiveChanges.xml'),
                    join(ctx.projectRoot, 'destructiveChanges', 'package.xml'),
                  ];
                  await fs.copy(ctx.destructiveChangesManifestFile, ctx.destructiveChanges.files[0]);
                  await fs.writeFile(
                    ctx.destructiveChanges.files[1],
                    `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
  <version>${ctx.sfdxProject.sourceApiVersion}</version>
</Package>`
                  );
                },
              },
            ]),
        },
        {
          title: `Generate ${join('package', 'package.xml')}`,
          task: (ctx, task): Listr =>
            task.newListr([
              {
                title: 'Prepare temp project',
                // eslint-disable-next-line no-shadow
                task: async (ctx): Promise<void> => {
                  ctx.manifestProjectPath = await prepareTempProject('manifest', ctx);
                },
              },
              {
                title: 'Create added files in temp project',
                // eslint-disable-next-line no-shadow
                task: async (ctx, task): Promise<void> => {
                  ctx.manifestSourceFiles = await addFilesToTempProject(
                    ctx.manifestProjectPath,
                    ctx.gitResults.added,
                    task,
                    ctx
                  );
                },
                options: {
                  bottomBar: 5,
                },
              },
              {
                title: 'Generate manifest',
                // eslint-disable-next-line no-shadow
                task: async (ctx, task): Promise<void> => {
                  ctx.manifestFile = null;
                  if (ctx.manifestSourceFiles.length > 0) {
                    ctx.manifestFile = await convertTempProject(
                      ctx.manifestProjectPath,
                      { destruct: false },
                      task,
                      ctx
                    );
                  }
                  if (ctx.manifestFile === null) {
                    ctx.manifestFile = join(ctx.manifestProjectPath, 'package.xml');
                    await fs.writeFile(
                      ctx.manifestFile,
                      `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
  <version>${ctx.sfdxProject.sourceApiVersion}</version>
</Package>`
                    );
                  }
                },
                options: {
                  bottomBar: 5,
                },
              },
              {
                title: 'Apply changes from modified files to manifest',
                // eslint-disable-next-line no-shadow
                task: async (ctx): Promise<void> => {
                  ctx.manifest.content = await appendToManifest(ctx.manifestFile, ctx.gitResults.modified.toManifest);
                },
              },
              {
                title: 'Save',
                task: async () => {
                  ctx.manifest.file = join(ctx.projectRoot, 'package', 'package.xml');
                  await fs.copy(ctx.manifestFile, ctx.manifest.file);
                },
              },
            ]),
        },
      ],
      {
        rendererOptions: { showTimer: true, collapse: false },
        rendererSilent: !this.isOutputEnabled,
        rendererFallback: debug.enabled,
      }
    );

    try {
      const context: Ctx = await tasks.run();
      if (debug.enabled) {
        if (this.isOutputEnabled) {
          logger.success(`Context: ${JSON.stringify(context, null, 2)}`);
        }
        return (context as unknown) as AnyJson;
      }
      if (Object.keys(context.warnings).length > 0) {
        Object.keys(context.warnings).forEach((w) => {
          this.ux.styledHeader(w);
          this.ux.styledObject(context.warnings[w]);
        });
      }
      return {
        destructiveChanges: (context.destructiveChanges as unknown) as AnyJson,
        manifest: (context.manifest as unknown) as AnyJson,
        warnings: (context.warnings as unknown) as AnyJson,
      };
    } catch (e) {
      if (debug.enabled) {
        if (this.isOutputEnabled) {
          logger.fail(e);
        }
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
