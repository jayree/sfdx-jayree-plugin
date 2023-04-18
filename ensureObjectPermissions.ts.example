import { readFileSync, writeJsonSync, readJSONSync } from 'fs-extra';
import { parse } from 'fast-xml-parser';

var objectPermissions = parse(readFileSync('force-app/main/default/profiles/Admin.profile-meta.xml', 'utf8'), {
  ignoreAttributes: false,
  parseNodeValue: false,
})
  .Profile.objectPermissions.map((el: { object: string }) => el.object)
  .filter(Boolean);

let fieldPermissions = parse(readFileSync('force-app/main/default/profiles/Admin.profile-meta.xml', 'utf8'), {
  ignoreAttributes: false,
  parseNodeValue: false,
})
  .Profile.fieldPermissions.map((el: { field: string }) => el.field.split('.')[0])
  .filter(Boolean);

let tabVisibilities = parse(readFileSync('force-app/main/default/profiles/Admin.profile-meta.xml', 'utf8'), {
  ignoreAttributes: false,
  parseNodeValue: false,
})
  .Profile.tabVisibilities.map((el: { tab: string }) => el.tab.split('-')[1])
  .filter(Boolean);

writeJsonSync(
  '.sfdx-jayree.json',
  {
    ...readJSONSync('.sfdx-jayree.json'),
    ensureObjectPermissions: [...new Set([...objectPermissions, ...fieldPermissions, ...tabVisibilities])].sort(),
  },
  { spaces: 4 }
);
