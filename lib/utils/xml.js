/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { XML_DECL, XML_NS_KEY, XML_NS_URL } from '@salesforce/source-deploy-retrieve/lib/src/common/index.js';
export function parseManifest(xmlData) {
    const parser = new XMLParser({
        stopNodes: ['version'],
        parseTagValue: false,
    });
    return parser.parse(xmlData);
}
export function js2Manifest(jsData) {
    const js2Xml = new XMLBuilder({ format: true, indentBy: '    ', ignoreAttributes: false });
    jsData.Package[XML_NS_KEY] = XML_NS_URL;
    return XML_DECL.concat(js2Xml.build(jsData));
}
const XML_DECL_KEY = '?xml';
export function js2SourceComponent(jsData) {
    const js2Xml = new XMLBuilder({ format: true, indentBy: '    ', ignoreAttributes: false });
    delete jsData[XML_DECL_KEY];
    return XML_DECL.concat(js2Xml.build(jsData));
}
export function parseSourceComponent(xmlData) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        parseTagValue: false,
    });
    return parser.parse(xmlData);
}
//# sourceMappingURL=xml.js.map