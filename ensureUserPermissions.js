const fs = require('fs-extra');
const xml2js = require('xml2js');

(async () => {
  fs.writeJson(
    'config/ensureUserPermissionsDeveloperEdition.json',
    {
      ensureUserPermissions: (
        await xml2js.parseStringPromise(fs.readFileSync('config/allUserPermissions.profile', 'utf8'))
      ).Profile.userPermissions.map((el) => el.name.toString()),
    },
    { spaces: 2 }
  );
})();
