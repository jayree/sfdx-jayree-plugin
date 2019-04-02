'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const test_1 = require('@salesforce/command/lib/test');
describe('jayree:packagedescription', () => {
  test_1.test
    .stdout()
    .command(['jayree:packagedescription:create', '-f', './test/assets/test.zip', '-d', 'test_description'])
    .it('runs jayree:packagedescription:create -f ./test/assets/test.zip -d test_description', ctx => {
      test_1.expect(ctx.stdout).to.contain('test_description');
    });
  test_1.test
    .stdout()
    .command(['jayree:packagedescription:set', '-f', './test/assets/test.zip', '-d', 'set_description'])
    .it('runs jayree:packagedescription:set -f ./test/assets/test.zip -d set_description', ctx => {
      test_1.expect(ctx.stdout).to.contain('set_description');
    });
  test_1.test
    .stdout()
    .command(['jayree:packagedescription:get', '-f', './test/assets/test.zip'])
    .it('runs jayree:packagedescription:get -f ./test/assets/test.zip', ctx => {
      test_1.expect(ctx.stdout).to.contain('set_description');
    });
  test_1.test
    .stdout()
    .command(['jayree:packagedescription:remove', '-f', './test/assets/test.zip'])
    .it('runs jayree:packagedescription:remove -f ./test/assets/test.zip', ctx => {
      test_1.expect(ctx.stdout).to.contain('set_description');
    });
  test_1.test
    .stdout()
    .command(['jayree:packagedescription:remove', '-f', './test/assets/test.zip'])
    .it('runs jayree:packagedescription:remove -f ./test/assets/test.zip', ctx => {
      test_1.expect(ctx.stdout).to.contain('no description found');
    });
  test_1.test
    .stdout()
    .command(['jayree:packagedescription:get', '-f', './test/assets/test.zip'])
    .it('runs jayree:packagedescription:get -f ./test/assets/test.zip', ctx => {
      test_1.expect(ctx.stdout).to.contain('');
    });
  test_1.test
    .stdout()
    .command(['jayree:packagedescription:set', '-f', './test/assets/test.zip', '-d', 'set_description2'])
    .it('runs jayree:packagedescription:set -f ./test/assets/test.zip -d set_description2', ctx => {
      test_1.expect(ctx.stdout).to.contain('set_description2');
    });
  test_1.test
    .stdout()
    .command(['jayree:packagedescription:set', '-f', './test/assets/test2.zip', '-d', 'set_description'])
    .it('runs jayree:packagedescription:set -f ./test/assets/test2.zip -d set_description2', ctx => {
      test_1.expect(ctx.stdout).to.contain('set_description');
    });
  test_1.test
    .stdout()
    .command(['jayree:packagedescription:remove', '-f', './test/assets/test2.zip'])
    .it('runs jayree:packagedescription:remove -f ./test/assets/test2.zip', ctx => {
      test_1.expect(ctx.stdout).to.contain('removed description: set_description');
    });
  test_1.test
    .stdout()
    .command(['jayree:packagedescription:get', '-f', './test/assets/test3.zip'])
    .it('runs jayree:packagedescription:get -f ./test/assets/test3.zip', ctx => {
      test_1.expect(ctx.stdout).to.contain('');
    });
});
//# sourceMappingURL=packagedescription.test.js.map
