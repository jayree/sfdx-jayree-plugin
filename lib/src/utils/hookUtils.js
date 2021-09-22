"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHooks = void 0;
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
const core_1 = require("@salesforce/core");
const kit = (0, tslib_1.__importStar)(require("@salesforce/kit"));
const config_1 = (0, tslib_1.__importDefault)(require("../utils/config"));
exports.runHooks = (() => {
    try {
        return (Boolean((0, config_1.default)(core_1.SfdxProject.resolveProjectPathSync()).runHooks) &&
            !kit.env.getBoolean('SFDX_DISABLE_JAYREE_HOOKS', false));
    }
    catch (error) {
        return false;
    }
})();
//# sourceMappingURL=hookUtils.js.map