import { expect, test } from '@salesforce/command/dist/test';

describe('jayree:openorg', () => {
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(request => {
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command(['jayree:openorg', '--targetusername', 'test@org.com'])
    .it('runs jayree:openorg --targetusername test@org.com', ctx => {
      expect(ctx.stdout).to.contain('test@org.com');
    });
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(request => {
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command([
      'jayree:openorg',
      '--targetusername',
      'test@org.com',
      '-r',
      '-b',
      'firefox'
    ])
    .it(
      'runs jayree:openorg --targetusername test@org.com -r -b firefox',
      ctx => {
        expect(ctx.stdout).to.contain('firefox');
      }
    );
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(request => {
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command([
      'jayree:openorg',
      '--targetusername',
      'test@org.com',
      '-r',
      '-b',
      'safari'
    ])
    .it(
      'runs jayree:openorg --targetusername test@org.com -r -b safari',
      ctx => {
        expect(ctx.stdout).to.contain('safari');
      }
    );
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(request => {
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command([
      'jayree:openorg',
      '--targetusername',
      'test@org.com',
      '-r',
      '-p',
      'lightning'
    ])
    .it(
      'runs jayree:openorg --targetusername test@org.com -r -p lightning',
      ctx => {
        expect(ctx.stdout).to.contain('lightning');
      }
    );
});
