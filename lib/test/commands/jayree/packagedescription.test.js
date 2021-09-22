"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const test_1 = require("@salesforce/command/lib/test");
describe('jayree:packagedescription', () => {
    test_1.test
        .stdout()
        .command(['jayree:packagedescription:create', '-f', './test/assets/test.zip', '-d', 'test_description'])
        .it('runs jayree:packagedescription:create -f ./test/assets/test.zip -d test_description', (ctx) => {
        (0, test_1.expect)(ctx.stdout).to.contain('test_description');
    });
    test_1.test
        .stdout()
        .command(['jayree:packagedescription:set', '-f', './test/assets/test.zip', '-d', 'set_description'])
        .it('runs jayree:packagedescription:set -f ./test/assets/test.zip -d set_description', (ctx) => {
        (0, test_1.expect)(ctx.stdout).to.contain('set_description');
    });
    test_1.test
        .stdout()
        .command(['jayree:packagedescription:get', '-f', './test/assets/test.zip'])
        .it('runs jayree:packagedescription:get -f ./test/assets/test.zip', (ctx) => {
        (0, test_1.expect)(ctx.stdout).to.contain('set_description');
    });
    test_1.test
        .stdout()
        .command(['jayree:packagedescription:remove', '-f', './test/assets/test.zip'])
        .it('runs jayree:packagedescription:remove -f ./test/assets/test.zip', (ctx) => {
        (0, test_1.expect)(ctx.stdout).to.contain('set_description');
    });
    test_1.test
        .stdout()
        .command(['jayree:packagedescription:remove', '-f', './test/assets/test.zip'])
        .it('runs jayree:packagedescription:remove -f ./test/assets/test.zip', (ctx) => {
        (0, test_1.expect)(ctx.stdout).to.contain('no description found');
    });
    test_1.test
        .stdout()
        .command(['jayree:packagedescription:get', '-f', './test/assets/test.zip'])
        .it('runs jayree:packagedescription:get -f ./test/assets/test.zip', (ctx) => {
        (0, test_1.expect)(ctx.stdout).to.contain('');
    });
    test_1.test
        .stdout()
        .command(['jayree:packagedescription:set', '-f', './test/assets/test.zip', '-d', 'set_description2'])
        .it('runs jayree:packagedescription:set -f ./test/assets/test.zip -d set_description2', (ctx) => {
        (0, test_1.expect)(ctx.stdout).to.contain('set_description2');
    });
    test_1.test
        .stdout()
        .command(['jayree:packagedescription:set', '-f', './test/assets/test2.zip', '-d', 'set_description'])
        .it('runs jayree:packagedescription:set -f ./test/assets/test2.zip -d set_description2', (ctx) => {
        (0, test_1.expect)(ctx.stdout).to.contain('set_description');
    });
    test_1.test
        .stdout()
        .command(['jayree:packagedescription:remove', '-f', './test/assets/test2.zip'])
        .it('runs jayree:packagedescription:remove -f ./test/assets/test2.zip', (ctx) => {
        (0, test_1.expect)(ctx.stdout).to.contain('removed description: set_description');
    });
    test_1.test
        .stdout()
        .command(['jayree:packagedescription:get', '-f', './test/assets/test3.zip'])
        .it('runs jayree:packagedescription:get -f ./test/assets/test3.zip', (ctx) => {
        (0, test_1.expect)(ctx.stdout).to.contain('');
    });
});
//# sourceMappingURL=packagedescription.test.js.map