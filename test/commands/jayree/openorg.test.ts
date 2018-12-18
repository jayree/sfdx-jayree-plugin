import { expect, test } from '@salesforce/command/lib/test';

describe('platform.win32', () => {
  before(function() {
    // save original process.platform
    this.originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');

    // redefine process.platform
    Object.defineProperty(process, 'platform', {
      value: 'win32'
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
    .command(['jayree:org:open', '--targetusername', 'test@org.com', '-r', '-b', 'firefox'])
    .it('runs jayree:org:open --targetusername test@org.com -r -b firefox', ctx => {
      expect(ctx.stdout).to.contain('firefox');
    });
  test
    .withOrg({ username: 'test@org.com' }, true)
    .stderr()
    .command(['jayree:org:open', '--targetusername', 'test@org.com', '-r', '-b', 'safari'])
    .it('runs jayree:org:open --targetusername test@org.com -r -b safari', ctx => {
      expect(ctx.stderr).to.contain('not supported');
    });
  test
    .withOrg({ username: 'test@org.com' }, true)
    .stdout()
    .command(['jayree:org:open', '--targetusername', 'test@org.com', '-r', '-p', 'lightning'])
    .it('runs jayree:org:open --targetusername test@org.com -r -p lightning', ctx => {
      expect(ctx.stdout).to.contain('lightning');
    });
});

describe('platform.undefined', () => {
  before(function() {
    // save original process.platform
    this.originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');

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
    .stderr()
    .command(['jayree:org:open', '--targetusername', 'test@org.com', '-r'])
    .it('runs jayree:org:open --targetusername test@org.com -r', ctx => {
      expect(ctx.stderr).to.contain('not supported');
    });
});

describe('platform.linux', () => {
  before(function () {
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

  after(function () {
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
    .stderr()
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
        expect(ctx.stderr).to.contain('not supported');
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

describe('platform.darwin', () => {
  before(function () {
    // save original process.platform
    this.originalPlatform = Object.getOwnPropertyDescriptor(
      process,
      'platform'
    );

    // redefine process.platform
    Object.defineProperty(process, 'platform', {
      value: 'darwin'
    });
  });

  after(function () {
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
        expect(ctx.stdout).to.contain('safari');
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
