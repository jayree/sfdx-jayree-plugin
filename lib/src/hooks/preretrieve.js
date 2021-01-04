"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preretrieve = void 0;
const kit_1 = require("@salesforce/kit");
const hookUtils_1 = require("../utils/hookUtils");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:hooks');
// eslint-disable-next-line @typescript-eslint/require-await
const preretrieve = async function (options) {
    debug(`called 'jayree:preretrieve' by: ${options.Command.id}`);
    if (!hookUtils_1.runHooks) {
        debug('hooks disabled');
        return;
    }
    kit_1.env.setBoolean('SFDX_DISABLE_PRETTIER', true);
    debug('set: SFDX_DISABLE_PRETTIER=true');
};
exports.preretrieve = preretrieve;
//# sourceMappingURL=preretrieve.js.map