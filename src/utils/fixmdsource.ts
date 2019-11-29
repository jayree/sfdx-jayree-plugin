import { Logger } from '@salesforce/core';
import * as fs from 'fs';
import * as _glob from 'glob';
import { join } from 'path';
import * as shell from 'shelljs';
import * as util from 'util';
import * as xml2js from 'xml2js';

const glob = util.promisify(_glob);

import * as objectPath from 'object-path';
const builder = new xml2js.Builder({
  xmldec: { version: '1.0', encoding: 'UTF-8' },
  xmlns: true,
  renderOpts: { pretty: true, indent: '    ', newline: '\n' }
});

// tslint:disable-next-line: no-any
(Array.prototype as any).equals = function(arr) {
  return this.length === arr.length && this.every((u, i) => u === arr[i]);
};

function compareobj(obj1, obj2) {
  // tslint:disable-next-line: no-any
  return ((!Array.isArray(obj2) ? [obj2] : obj2) as any).equals(!Array.isArray(obj1) ? [obj1] : obj1);
}

function exists(path) {
  try {
    fs.accessSync(path);
    return true;
  } catch (err) {
    // null
  }
  return false;
}
export async function sourcefix(fixsources, root) {
  const logger = await Logger.child('RetrieveProfiles');

  for await (const filename of Object.keys(fixsources)) {
    const path = join(root, filename);

    const files = await glob(path);

    for (const file of files) {
      if (exists(file)) {
        let data;
        new xml2js.Parser().parseString(fs.readFileSync(file, 'utf8'), (e, r) => {
          data = r;
        });
        logger.info(`modify file: ${file}`, 1);
        if (fixsources[filename].delete) {
          for (const deltask of fixsources[filename].delete) {
            const delpath = () => {
              if (objectPath.get(data, deltask.path)) {
                let delitems = [];
                if (Array.isArray(objectPath.get(data, deltask.path))) {
                  delitems = objectPath.get(data, deltask.path);
                } else {
                  delitems = [objectPath.get(data, deltask.path)];
                }
                if (delitems.length === 1) {
                  if (
                    (deltask.condition && compareobj(objectPath.get(data, `${deltask.path}`), deltask.condition[1])) ||
                    typeof deltask.condition === 'undefined'
                  ) {
                    return `${deltask.path}`;
                  }
                }
                for (let i = 0; i < delitems.length; i++) {
                  if (deltask.object) {
                    if (
                      JSON.stringify(objectPath.get(data, `${deltask.path}.${i}`)) === JSON.stringify(deltask.object)
                    ) {
                      return `${deltask.path}.${i}`;
                    }
                  }
                  if (deltask.condition && deltask.condition[0] === 'is') {
                    if (compareobj(objectPath.get(data, `${deltask.path}.${i}`), deltask.condition[1])) {
                      return `${deltask.path}.${i}`;
                    }
                  }
                  if (
                    deltask.condition &&
                    compareobj(
                      objectPath.get(data, `${deltask.path}.${i}.${deltask.condition[0]}`),
                      deltask.condition[1]
                    )
                  ) {
                    return `${deltask.path}.${i}`;
                  }
                }
              } else {
                return undefined;
              }
            };

            if (typeof delpath() !== 'undefined') {
              // console.log(`delete: ${delpath()}`, 2);
              objectPath.del(data, delpath());
              fs.writeFileSync(
                file,
                builder.buildObject(data) + '\n' // .replace(/ {2}/g, "    ")
              );
            } else {
              if (typeof deltask.condition !== 'undefined') {
                /*                   console.log(
                    `delete: condition for '${deltask.path}': '${deltask.condition
                      .toString()
                      .replace(',', ' => ')}' not match`,
                    2
                  ); */
              } else {
                // console.log(`delete: '${deltask.path} not found`, 2);
              }
            }
          }
        }
      } else {
        // console.log(`modify file: ${path} not found`, 1);
      }
    }
  }
}

export async function sourcedelete(deletesources, root) {
  const logger = await Logger.child('RetrieveProfiles');

  for (const filename of deletesources) {
    const path = join(root, filename);
    logger.info(`delete file: ${path}`, 1);
    // if (exists(path)) {
    if (exists(path)) {
      try {
        shell.rm('-rf', path);
      } catch (err) {
        // console.error(err);
      }
    } else {
      // console.log(`${path} not found`, 2);
    }
  }
}
