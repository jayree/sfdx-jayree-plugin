/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { SfdxCommand } from '@salesforce/command';
export class JayreeSfdxCommand extends SfdxCommand {
    warnIfRunByAlias(aliases, id) {
        if (aliases.some((r) => process.argv.includes(r))) {
            this.ux.warn(`You are using a deprecated alias of the command: ${id}`);
        }
    }
}
//# sourceMappingURL=jayreeSfdxCommand.js.map