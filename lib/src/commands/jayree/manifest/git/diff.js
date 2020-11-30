"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path_1 = require("path");
const util = tslib_1.__importStar(require("util"));
const command_1 = require("@salesforce/command");
const fs = tslib_1.__importStar(require("fs-extra"));
const listr2_1 = require("listr2");
const kit = tslib_1.__importStar(require("@salesforce/kit"));
const gitdiff_1 = require("../../../../utils/gitdiff");
command_1.core.Messages.importMessagesDirectory(__dirname);
const messages = command_1.core.Messages.loadMessages('sfdx-jayree', 'gitdiff');
const logger = new listr2_1.Logger({ useIcons: false });
const unexpectedArgument = (input) => {
    if (input.includes('-')) {
        throw new Error(`Unexpected argument: ${input}
  See more help with --help`);
    }
    return input;
};
class GitDiff extends command_1.SfdxCommand {
    // eslint-disable-next-line @typescript-eslint/require-await
    async run() {
        const isContentTypeJSON = kit.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
        this.isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);
        const gitArgs = this.getGitArgsFromArgv();
        const tasks = new listr2_1.Listr([
            {
                // title: 'Prepare',
                task: (ctx) => {
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
                task: async (ctx, task) => {
                    ctx.sfdxProject = JSON.parse((await fs.readFile(path_1.join(ctx.projectRoot, 'sfdx-project.json'))).toString());
                    ctx.sfdxProjectFolders = ctx.sfdxProject.packageDirectories.map((p) => p.path);
                    task.output = `found ${ctx.sfdxProjectFolders.length} package ${util.format('director%s', ctx.sfdxProjectFolders.length === 1 ? 'y' : 'ies')}`;
                },
                options: { persistentOutput: true },
            },
            {
                title: 'Analyze git diff ...',
                task: async (ctx, task) => {
                    task.title = `Analyze git diff ${ctx.git.ref1ref2}`;
                    ctx.gitResults = await gitdiff_1.getGitResults(task, ctx);
                },
                options: { persistentOutput: true },
            },
            {
                title: `Generate ${path_1.join('destructiveChanges', 'destructiveChanges.xml')}`,
                task: (ctx, task) => task.newListr([
                    {
                        title: 'Prepare temp project',
                        // eslint-disable-next-line no-shadow
                        task: async (ctx) => {
                            ctx.tmpbasepath = path_1.join(ctx.projectRoot, '.sfdx', 'temp', `sdx_sourceGitDiff_${Date.now()}`);
                            process.once('beforeExit', () => {
                                void fs.remove(ctx.tmpbasepath);
                            });
                            process.once('SIGINT', () => {
                                fs.removeSync(ctx.tmpbasepath);
                            });
                            ctx.destructiveChangesProjectPath = await gitdiff_1.prepareTempProject('destructiveChanges', ctx);
                        },
                    },
                    {
                        title: 'Create deleted files in temp project',
                        // eslint-disable-next-line no-shadow
                        task: async (ctx, task) => {
                            ctx.destructiveChangesSourceFiles = await gitdiff_1.addFilesToTempProject(ctx.destructiveChangesProjectPath, ctx.gitResults.deleted, task, ctx);
                        },
                        options: {
                            bottomBar: 5,
                        },
                    },
                    {
                        title: 'Generate manifest',
                        // eslint-disable-next-line no-shadow
                        task: async (ctx, task) => {
                            ctx.destructiveChangesManifestFile = null;
                            if (ctx.destructiveChangesSourceFiles.length > 0) {
                                ctx.destructiveChangesManifestFile = await gitdiff_1.convertTempProject(ctx.destructiveChangesProjectPath, {
                                    destruct: true,
                                }, task, ctx);
                            }
                            if (ctx.destructiveChangesManifestFile === null) {
                                ctx.destructiveChangesManifestFile = path_1.join(ctx.destructiveChangesProjectPath, 'package.xml');
                                await fs.writeFile(ctx.destructiveChangesManifestFile, `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
  <version>${ctx.sfdxProject.sourceApiVersion}</version>
</Package>`);
                            }
                        },
                        options: {
                            bottomBar: 5,
                        },
                    },
                    {
                        title: 'Apply changes from modified files to manifest',
                        // eslint-disable-next-line no-shadow
                        task: async (ctx) => {
                            ctx.destructiveChanges.content = await gitdiff_1.appendToManifest(ctx.destructiveChangesManifestFile, ctx.gitResults.modified.toDestructiveChanges);
                        },
                    },
                    {
                        title: 'Save',
                        // eslint-disable-next-line no-shadow
                        task: async (ctx) => {
                            ctx.destructiveChanges.files = [
                                path_1.join(ctx.projectRoot, 'destructiveChanges', 'destructiveChanges.xml'),
                                path_1.join(ctx.projectRoot, 'destructiveChanges', 'package.xml'),
                            ];
                            await fs.copy(ctx.destructiveChangesManifestFile, ctx.destructiveChanges.files[0]);
                            await fs.writeFile(ctx.destructiveChanges.files[1], `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
  <version>${ctx.sfdxProject.sourceApiVersion}</version>
</Package>`);
                        },
                    },
                ]),
            },
            {
                title: `Generate ${path_1.join('package', 'package.xml')}`,
                task: (ctx, task) => task.newListr([
                    {
                        title: 'Prepare temp project',
                        // eslint-disable-next-line no-shadow
                        task: async (ctx) => {
                            ctx.manifestProjectPath = await gitdiff_1.prepareTempProject('manifest', ctx);
                        },
                    },
                    {
                        title: 'Create added files in temp project',
                        // eslint-disable-next-line no-shadow
                        task: async (ctx, task) => {
                            ctx.manifestSourceFiles = await gitdiff_1.addFilesToTempProject(ctx.manifestProjectPath, ctx.gitResults.added, task, ctx);
                        },
                        options: {
                            bottomBar: 5,
                        },
                    },
                    {
                        title: 'Generate manifest',
                        // eslint-disable-next-line no-shadow
                        task: async (ctx, task) => {
                            ctx.manifestFile = null;
                            if (ctx.manifestSourceFiles.length > 0) {
                                ctx.manifestFile = await gitdiff_1.convertTempProject(ctx.manifestProjectPath, { destruct: false }, task, ctx);
                            }
                            if (ctx.manifestFile === null) {
                                ctx.manifestFile = path_1.join(ctx.manifestProjectPath, 'package.xml');
                                await fs.writeFile(ctx.manifestFile, `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
  <version>${ctx.sfdxProject.sourceApiVersion}</version>
</Package>`);
                            }
                        },
                        options: {
                            bottomBar: 5,
                        },
                    },
                    {
                        title: 'Apply changes from modified files to manifest',
                        // eslint-disable-next-line no-shadow
                        task: async (ctx) => {
                            ctx.manifest.content = await gitdiff_1.appendToManifest(ctx.manifestFile, ctx.gitResults.modified.toManifest);
                        },
                    },
                    {
                        title: 'Save',
                        task: async () => {
                            ctx.manifest.file = path_1.join(ctx.projectRoot, 'package', 'package.xml');
                            await fs.copy(ctx.manifestFile, ctx.manifest.file);
                        },
                    },
                ]),
            },
        ], {
            rendererOptions: { showTimer: true, collapse: false },
            rendererSilent: !this.isOutputEnabled,
            rendererFallback: gitdiff_1.debug.enabled,
        });
        try {
            const context = await tasks.run();
            if (gitdiff_1.debug.enabled) {
                if (this.isOutputEnabled) {
                    logger.success(`Context: ${JSON.stringify(context, null, 2)}`);
                }
                return context;
            }
            if (Object.keys(context.warnings).length > 0) {
                Object.keys(context.warnings).forEach((w) => {
                    this.ux.styledHeader(w);
                    this.ux.styledObject(context.warnings[w]);
                });
            }
            return {
                destructiveChanges: context.destructiveChanges,
                manifest: context.manifest,
                warnings: context.warnings,
            };
        }
        catch (e) {
            if (gitdiff_1.debug.enabled) {
                if (this.isOutputEnabled) {
                    logger.fail(e);
                }
            }
            throw e;
        }
    }
    getGitArgsFromArgv() {
        const argv = this.argv.filter((v) => !v.includes('-'));
        let ref1ref2 = this.args.ref1;
        const a = argv.join('.').split('.');
        if ((a.length === 3 || a.length === 4) && typeof this.args.ref2 === 'undefined') {
            this.args.ref1 = a[0];
            this.args.ref2 = a[a.length - 1];
        }
        else if (a.length === 2 && typeof this.args.ref2 !== 'undefined') {
            ref1ref2 = `${this.args.ref1}..${this.args.ref2}`;
        }
        else if (a.length === 1) {
            this.args.ref2 = '';
        }
        else {
            throw new Error(`Ambiguous ${util.format('argument%s', argv.length === 1 ? '' : 's')}: ${argv.join(', ')}
See more help with --help`);
        }
        return { ref1: this.args.ref1, ref2: this.args.ref2, ref1ref2 };
    }
}
exports.default = GitDiff;
GitDiff.description = messages.getMessage('commandDescription');
GitDiff.examples = [
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
GitDiff.args = [
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
GitDiff.requiresUsername = false;
GitDiff.supportsDevhubUsername = false;
GitDiff.requiresProject = true;
//# sourceMappingURL=diff.js.map