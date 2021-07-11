import { RegistryAccess } from '@salesforce/source-deploy-retrieve';
import * as describe from './metadata/describe.json';

const xmlNames = describe.metadataObjects.map((el) => el.xmlName);

xmlNames.forEach((xmlName) => {
  const XmlTypesOfXmlNameLegacy = ((xmlName) => {
    const metadata = describe.metadataObjects.filter((md) => md.xmlName === xmlName);
    if (metadata[0] && metadata[0].childXmlNames) {
      return metadata[0].childXmlNames;
    }
    return {};
  })(xmlName);

  const XmlTypesOfXmlName = ((xmlName) => {
    try {
      const childTypeMapping = {};
      Object.values(new RegistryAccess().getTypeByName(xmlName).children.types).forEach((element) => {
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
    console.log({ xmlName, describe: XmlTypesOfXmlNameLegacy, registry: XmlTypesOfXmlName });
  }
});
