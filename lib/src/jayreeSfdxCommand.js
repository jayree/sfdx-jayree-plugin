"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JayreeSfdxCommand = void 0;
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const command_1 = require("@salesforce/command");
class JayreeSfdxCommand extends command_1.SfdxCommand {
    warnIfRunByAlias(aliases, id) {
        if (aliases.some((r) => process.argv.includes(r))) {
            this.ux.warn(`You are using a deprecated alias of the command: ${id}`);
        }
    }
}
exports.JayreeSfdxCommand = JayreeSfdxCommand;
//# sourceMappingURL=jayreeSfdxCommand.js.map