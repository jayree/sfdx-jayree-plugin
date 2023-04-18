import { readFileSync, writeJsonSync, readJSONSync } from 'fs-extra';
import { parse } from 'fast-xml-parser';

var objectPermissions = parse(
  readFileSync('force-app/main/default/profiles/allUserPermissions.profile-meta.xml', 'utf8'),
  {
    ignoreAttributes: false,
    parseNodeValue: false,
  }
)
  .Profile.userPermissions.map((el: { name: string }) => el.name)
  .filter(Boolean);

writeJsonSync(
  '.sfdx-jayree.json',
  {
    ...readJSONSync('.sfdx-jayree.json'),
    ensureUserPermissions: [...new Set([...objectPermissions])].sort(),
  },
  { spaces: 4 }
);
