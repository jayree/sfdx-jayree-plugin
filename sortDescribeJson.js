const fs = require('fs-extra');
const xml2js = require('xml2js');

(async () => {
  await fs.writeJson(
    'metadata/describe.json',
    {
      metadataObjects: (await fs.readJSON('metadata/describe.json')).metadataObjects.sort(function (a, b) {
        return a.xmlName < b.xmlName ? -1 : a.xmlName > b.xmlName ? 1 : 0;
      }),
    },
    { spaces: 2 }
  );
})();
