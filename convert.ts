import * as fs from 'fs-extra';
import { join } from 'path';
import * as util from 'util';

import * as xml2js from 'xml2js';
const parseString = util.promisify(xml2js.parseString);

(async () => {
  const x = await parseString(fs.readFileSync(join('', 'config/empty.profile-meta.xml'), 'utf8'));
  fs.writeFileSync('config/profileinsertions.json', JSON.stringify(x));
})();
