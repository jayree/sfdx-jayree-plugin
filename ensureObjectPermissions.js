const fs = require('fs-extra');
const xml2js = require('xml2js');

(async () => {
  fs.writeJson(
    'config/ensureObjectPermissionsDeveloperEdition.json',
    {
      ensureObjectPermissions: (
        await xml2js.parseStringPromise(fs.readFileSync('config/Admin.profile', 'utf8'))
      ).Profile.objectPermissions.map((el) => el.object.toString()),
    },
    { spaces: 2 }
  );
})();
