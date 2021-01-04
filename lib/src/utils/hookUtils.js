"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHook = void 0;
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const core = tslib_1.__importStar(require("@salesforce/core"));
const kit = tslib_1.__importStar(require("@salesforce/kit"));
const config_1 = tslib_1.__importDefault(require("../utils/config"));
exports.runHook = Boolean(config_1.default(core.SfdxProject.resolveProjectPathSync()).runHooks) &&
    !kit.env.getBoolean('SFDX_DISABLE_JAYREE_HOOKS', false);
//# sourceMappingURL=hookUtils.js.map