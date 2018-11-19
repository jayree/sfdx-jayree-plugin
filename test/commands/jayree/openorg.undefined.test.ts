import { expect, test } from '@salesforce/command/dist/test';

describe('jayree:org:open', () => {
  before(function() {
    // save original process.platform
    this.originalPlatform = Object.getOwnPropertyDescriptor(
      process,
      'platform'
    );

    // redefine process.platform
    Object.defineProperty(process, 'platform', {
      value: 'undefined'
    });
  });

  after(function() {
    // restore original process.platfork
    Object.defineProperty(process, 'platform', this.originalPlatform);
  });
  test
    .withOrg({ username: 'test@org.com' }, true)
    .stdout()
    .command(['jayree:org:open', '--targetusername', 'test@org.com', '-r'])
    .it('runs jayree:org:open --targetusername test@org.com -r', ctx => {
      expect(ctx.stdout).to.contain('');
    });
});
