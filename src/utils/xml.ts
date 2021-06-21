/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as xml2js from 'xml2js';

export const builder = new xml2js.Builder({
  xmldec: { version: '1.0', encoding: 'UTF-8' },
  xmlns: true,
  renderOpts: { pretty: true, indent: '    ', newline: '\n' },
});
/* istanbul ignore next*/
export function parseStringSync(str, explicitArray = true) {
  let result;
  xml2js.parseString(str, { explicitArray }, (e, r) => {
    result = r;
  });
  return result;
}
