"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsourceupdate = void 0;
const kit_1 = require("@salesforce/kit");
const souceUtils_1 = require("../utils/souceUtils");
const hookUtils_1 = require("../utils/hookUtils");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:hooks');
const isContentTypeJSON = kit_1.env.getString('SFDX_CONTENT_TYPE', '').toUpperCase() === 'JSON';
const isOutputEnabled = !(process.argv.find((arg) => arg === '--json') || isContentTypeJSON);
const postsourceupdate = async function (options) {
    debug(`called 'jayree:postsourceupdate' by: ${options.Command.id}`);
    if (!hookUtils_1.runHooks) {
        debug('hooks disabled');
        return;
    }
    let sourcePaths = Object.values(options.result)
        .map((el) => el.workspaceElements)
        .flat()
        .map((el) => el.filePath);
    debug({ sourcePaths });
    const movedSourceFiles = await souceUtils_1.moveSourceFilesByFolder();
    movedSourceFiles.forEach((element) => {
        const index = sourcePaths.indexOf(element.from);
        sourcePaths[index] = element.to;
    });
    debug({ movedSourceFiles });
    const updatedfiles = await souceUtils_1.applySourceFixes(sourcePaths);
    debug({ updatedfiles });
    const toRemove = Object.values(updatedfiles)
        .flat()
        .filter((value) => value.operation === 'deleteFile')
        .map((value) => value.filePath);
    debug({ toRemove });
    sourcePaths = sourcePaths.filter((el) => !toRemove.includes(el));
    process.once('beforeExit', () => {
        debug('beforeExit');
        if (isOutputEnabled) {
            void souceUtils_1.logMoves(movedSourceFiles);
            void souceUtils_1.logFixes(updatedfiles);
        }
        void this.config.runHook('prettierFormat', Object.assign(Object.assign({}, options), { result: sourcePaths }));
    });
};
exports.postsourceupdate = postsourceupdate;
//# sourceMappingURL=postsourceupdate.js.map