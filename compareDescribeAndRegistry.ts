import { RegistryAccess } from '@salesforce/source-deploy-retrieve';
import * as describe from './metadata/describe.json';

import { deepFreeze } from '@salesforce/source-deploy-retrieve/lib/src/utils';
import * as registryData from './metadata/registry.json';
const registry = deepFreeze(registryData);

// import { registry as defaultRegistry } from '@salesforce/source-deploy-retrieve';
// const registry = defaultRegistry;

const registryAccess = new RegistryAccess(registry);

const xmlNames = describe.metadataObjects.map((el) => el.xmlName);
let allLegacyXmlNames = [];
xmlNames.forEach((xmlName) => {
  allLegacyXmlNames.push(xmlName);
  const XmlTypesOfXmlNameLegacy = ((xmlName) => {
    const metadata = describe.metadataObjects.filter((md) => md.xmlName === xmlName);
    if (metadata[0] && metadata[0].childXmlNames) {
      return metadata[0].childXmlNames;
    }
    return {};
  })(xmlName);
  allLegacyXmlNames = allLegacyXmlNames.concat(Object.values(XmlTypesOfXmlNameLegacy));

  const XmlTypesOfXmlName = ((xmlName) => {
    try {
      const childTypeMapping = {};
      Object.values(registryAccess.getTypeByName(xmlName).children.types).forEach((element) => {
        childTypeMapping[element.directoryName] = element.name;
      });
      return childTypeMapping;
    } catch (error) {
      return {};
    }
  })(xmlName);

  if (
    Object.entries(XmlTypesOfXmlNameLegacy).sort().toString() !== Object.entries(XmlTypesOfXmlName).sort().toString()
  ) {
    console.log({
      status: 'missing or different childtype',
      xmlName,
      describe: XmlTypesOfXmlNameLegacy,
      registry: XmlTypesOfXmlName,
    });
  }
  try {
    registryAccess.getTypeByName(xmlName).name;
  } catch (error) {
    console.log({ status: 'missing type in registry', describe: xmlName, registry: error.message });
  }
});
Object.keys(registry.types).forEach((key) => {
  if (!allLegacyXmlNames.includes(registry.types[key].name)) {
    // console.log({ status: 'missing type in describe', describe: allLegacyXmlNames.includes(registry.types[key].name), registry: registry.types[key] });
  }
  if (registry?.types[key]?.children?.types) {
    Object.keys(registry.types[key].children.types).forEach((ckey) => {
      if (!allLegacyXmlNames.includes(registry.types[key].children.types[ckey].name)) {
        //   console.log({ status: 'missing childtype in describe', describe: allLegacyXmlNames.includes(registry.types[key].children.types[ckey].name), registry: registry.types[key].children.types[ckey] });
      }
    });
  }
});

// const suffixes = {};
// Object.keys(registry.types).forEach((key) => {
//   // if (registry.types[key].strictDirectoryName === true) {
//   //  suffixes[registry.types[key].directoryName] = key;
//   if (registry.types[key].suffix) {
//     suffixes[registry.types[key].suffix] = key;
//   }
//   if (registry.types[key].strategies && registry.types[key].children) {
//     if (registry.types[key].children) {
//       if (registry.types[key].strategies.transformer === 'decomposed') {
//         Object.keys(registry.types[key].children.types).forEach((k) => {
//           if (registry.types[key].children.types[k].suffix) {
//             suffixes[registry.types[key].children.types[k].suffix] = k;
//             // suffixes[k] = key;
//           }
//         });
//       }
//     }
//   }
// });
// console.log(suffixes);
