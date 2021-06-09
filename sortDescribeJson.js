const fs = require('fs-extra');

(async () => {
  await fs.writeJson(
    'metadata/describe.json',
    {
      metadataObjects: (
        await fs.readJSON(
          require('path').join(
            require('os').homedir(),
            '/.local/share/sfdx/client/current/node_modules/salesforce-alm/metadata/describe.json'
          )
        )
      ).metadataObjects.sort(function (a, b) {
        return a.xmlName < b.xmlName ? -1 : a.xmlName > b.xmlName ? 1 : 0;
      }),
    },
    { spaces: 2 }
  );
})();
