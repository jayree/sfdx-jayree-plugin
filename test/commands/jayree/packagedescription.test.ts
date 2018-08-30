import { expect, test } from '@salesforce/command/dist/test';

describe('jayree:packagedescription', () => {
  test
    .stdout()
    .command(['jayree:packagedescription:get', '-f', 'test.zip'])
    .it('runs jayree:packagedescription:get -f test.zip', ctx => {
      expect(ctx.stdout).to.contain('');
    });

  test
    .stdout()
    .command(['jayree:packagedescription:get', '-f', 'test.zip'])
    .it('runs jayree:packagedescription:get -f test.zip', ctx => {
      expect(ctx.stdout).to.contain('');
    });
});
