import { expect, test } from '@salesforce/command/dist/test';

describe('jayree:packagexml', () => {
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(request => {
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command(['jayree:packagexml', '--targetusername', 'test@org.com'])
    .it('runs jayree:packagexml --targetusername test@org.com', ctx => {
      expect(ctx.stdout).to.contain('');
    });
});
