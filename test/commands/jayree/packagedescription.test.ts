import { expect, test } from '@salesforce/command/dist/test';

describe('jayree:packagedescription', () => {
  test
    .stdout()
    .command([
      'jayree:packagedescription:create',
      '-f',
      './test/assets/test.zip',
      '-d',
      'test_description'
    ])
    .it(
      'runs jayree:packagedescription:create -f ./test/assets/test.zip -d test_description',
      ctx => {
        expect(ctx.stdout).to.contain('test_description');
      }
    );

  test
    .stdout()
    .command([
      'jayree:packagedescription:set',
      '-f',
      './test/assets/test.zip',
      '-d',
      'set_description'
    ])
    .it(
      'runs jayree:packagedescription:set -f ./test/assets/test.zip -d set_description',
      ctx => {
        expect(ctx.stdout).to.contain('set_description');
      }
    );

  test
    .stdout()
    .command(['jayree:packagedescription:get', '-f', './test/assets/test.zip'])
    .it('runs jayree:packagedescription:get -f ./test/assets/test.zip', ctx => {
      expect(ctx.stdout).to.contain('set_description');
    });

  test
    .stdout()
    .command([
      'jayree:packagedescription:remove',
      '-f',
      './test/assets/test.zip'
    ])
    .it(
      'runs jayree:packagedescription:remove -f ./test/assets/test.zip',
      ctx => {
        expect(ctx.stdout).to.contain('set_description');
      }
    );

  test
    .stdout()
    .command([
      'jayree:packagedescription:remove',
      '-f',
      './test/assets/test.zip'
    ])
    .it(
      'runs jayree:packagedescription:remove -f ./test/assets/test.zip',
      ctx => {
        expect(ctx.stdout).to.contain('no description found');
      }
    );

  test
    .stdout()
    .command(['jayree:packagedescription:get', '-f', './test/assets/test.zip'])
    .it('runs jayree:packagedescription:get -f ./test/assets/test.zip', ctx => {
      expect(ctx.stdout).to.contain('');
    });

  test
    .stdout()
    .command([
      'jayree:packagedescription:set',
      '-f',
      './test/assets/test.zip',
      '-d',
      'set_description2'
    ])
    .it(
      'runs jayree:packagedescription:set -f ./test/assets/test.zip -d set_description2',
      ctx => {
        expect(ctx.stdout).to.contain('set_description2');
      }
    );

  test
    .stdout()
    .command([
      'jayree:packagedescription:set',
      '-f',
      './test/assets/test2.zip',
      '-d',
      'set_description'
    ])
    .it(
      'runs jayree:packagedescription:set -f ./test/assets/test2.zip -d set_description2',
      ctx => {
        expect(ctx.stdout).to.contain('set_description');
      }
    );

  test
    .stdout()
    .command([
      'jayree:packagedescription:remove',
      '-f',
      './test/assets/test2.zip'
    ])
    .it(
      'runs jayree:packagedescription:remove -f ./test/assets/test2.zip',
      ctx => {
        expect(ctx.stdout).to.contain('removed description: set_description');
      }
    );

  test
    .stdout()
    .command(['jayree:packagedescription:get', '-f', './test/assets/test3.zip'])
    .it(
      'runs jayree:packagedescription:get -f ./test/assets/test3.zip',
      ctx => {
        expect(ctx.stdout).to.contain('');
      }
    );
});
