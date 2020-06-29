import { SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import { accessSync, readFileSync } from 'fs';
import { dirname, join } from 'path';

export default class Version extends SfdxCommand {
  public static hidden = true;

  public async run(): Promise<AnyJson> {
    const root = () => {
      let currentPath = __dirname;
      let rootpath;
      while (!rootpath) {
        try {
          accessSync(join(currentPath, 'package.json'));
          rootpath = currentPath;
        } catch {
          currentPath = dirname(currentPath);
        }
      }
      return rootpath;
    };

    const packageJsonData = JSON.parse(readFileSync(join(root(), 'package.json'), 'utf-8'));
    this.ux.log(packageJsonData.version);
    return {
      version: packageJsonData.version
    };
  }
}
