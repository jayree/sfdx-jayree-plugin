import { expect, test } from '@salesforce/command/dist/test';

describe('jayree:packagedescription', () => {
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(request => {
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command(['jayree:packagedescription:get', '--targetusername', 'test@org.com'])
    .it('runs jayree:packagedescription:get --targetusername test@org.com', ctx => {
      expect(ctx.stdout).to.contain('<version>43.0</version>');
    });
});
