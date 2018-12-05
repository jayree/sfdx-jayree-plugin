import { expect, test } from '@salesforce/command/lib/test';

describe('jayree:org:open', () => {
  before(function() {
    // save original process.platform
    this.originalPlatform = Object.getOwnPropertyDescriptor(
      process,
      'platform'
    );

    // redefine process.platform
    Object.defineProperty(process, 'platform', {
      value: 'linux'
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
      expect(ctx.stdout).to.contain('test@org.com');
    });
  test
    .withOrg({ username: 'test@org.com' }, true)
    .stdout()
    .command([
      'jayree:org:open',
      '--targetusername',
      'test@org.com',
      '-r',
      '-b',
      'firefox'
    ])
    .it(
      'runs jayree:org:open --targetusername test@org.com -r -b firefox',
      ctx => {
        expect(ctx.stdout).to.contain('firefox');
      }
    );
  test
    .withOrg({ username: 'test@org.com' }, true)
    .stdout()
    .command([
      'jayree:org:open',
      '--targetusername',
      'test@org.com',
      '-r',
      '-b',
      'safari'
    ])
    .it(
      'runs jayree:org:open --targetusername test@org.com -r -b safari',
      ctx => {
        expect(ctx.stdout).to.contain('');
      }
    );
  test
    .withOrg({ username: 'test@org.com' }, true)
    .stdout()
    .command([
      'jayree:org:open',
      '--targetusername',
      'test@org.com',
      '-r',
      '-p',
      'lightning'
    ])
    .it(
      'runs jayree:org:open --targetusername test@org.com -r -p lightning',
      ctx => {
        expect(ctx.stdout).to.contain('lightning');
      }
    );
});
