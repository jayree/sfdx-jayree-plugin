/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { parse, j2xParser } from 'fast-xml-parser';
import { XML_DECL, XML_NS_KEY, XML_NS_URL } from '@salesforce/source-deploy-retrieve/lib/src/common';

export function parseManifest(xmlData: string) {
  return parse(xmlData, {
    stopNodes: ['version'],
  });
}

export function js2Manifest(jsData) {
  const js2Xml = new j2xParser({ format: true, indentBy: '    ', ignoreAttributes: false });
  jsData.Package[XML_NS_KEY] = XML_NS_URL;
  return XML_DECL.concat(js2Xml.parse(jsData));
}

export function js2SourceComponent(jsData) {
  const js2Xml = new j2xParser({ format: true, indentBy: '    ', ignoreAttributes: false });
  jsData[Object.keys(jsData)[0]][XML_NS_KEY] = XML_NS_URL;
  return XML_DECL.concat(js2Xml.parse(jsData));
}

// function JsToXml(jsData, key) {
//   const js2Xml = new j2xParser({ format: true, indentBy: '    ', ignoreAttributes: false });
//   jsData[key][XML_NS_KEY] = XML_NS_URL;
//   return XML_DECL.concat(js2Xml.parse(jsData));
// }

export function parseSourceComponent(xmlData: string) {
  const x = parse(xmlData, {
    ignoreAttributes: false,
    parseNodeValue: false,
    ignoreNameSpace: true,
  });
  return x;
}

export function normalizeToArray<T>(entryOrArray: T | T[] | undefined): T[] {
  if (entryOrArray) {
    return Array.isArray(entryOrArray) ? entryOrArray : [entryOrArray];
  }
  return [];
}
