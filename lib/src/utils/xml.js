"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeToArray = exports.parseSourceComponent = exports.js2SourceComponent = exports.js2Manifest = exports.parseManifest = void 0;
/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const fast_xml_parser_1 = require("fast-xml-parser");
const common_1 = require("@salesforce/source-deploy-retrieve/lib/src/common");
function parseManifest(xmlData) {
    return fast_xml_parser_1.parse(xmlData, {
        stopNodes: ['version'],
    });
}
exports.parseManifest = parseManifest;
function js2Manifest(jsData) {
    const js2Xml = new fast_xml_parser_1.j2xParser({ format: true, indentBy: '    ', ignoreAttributes: false });
    jsData.Package[common_1.XML_NS_KEY] = common_1.XML_NS_URL;
    return common_1.XML_DECL.concat(js2Xml.parse(jsData));
}
exports.js2Manifest = js2Manifest;
function js2SourceComponent(jsData) {
    const js2Xml = new fast_xml_parser_1.j2xParser({ format: true, indentBy: '    ', ignoreAttributes: false });
    jsData[Object.keys(jsData)[0]][common_1.XML_NS_KEY] = common_1.XML_NS_URL;
    return common_1.XML_DECL.concat(js2Xml.parse(jsData));
}
exports.js2SourceComponent = js2SourceComponent;
// function JsToXml(jsData, key) {
//   const js2Xml = new j2xParser({ format: true, indentBy: '    ', ignoreAttributes: false });
//   jsData[key][XML_NS_KEY] = XML_NS_URL;
//   return XML_DECL.concat(js2Xml.parse(jsData));
// }
function parseSourceComponent(xmlData) {
    const x = fast_xml_parser_1.parse(xmlData, {
        ignoreAttributes: false,
        parseNodeValue: false,
        ignoreNameSpace: true,
    });
    return x;
}
exports.parseSourceComponent = parseSourceComponent;
function normalizeToArray(entryOrArray) {
    if (entryOrArray) {
        return Array.isArray(entryOrArray) ? entryOrArray : [entryOrArray];
    }
    return [];
}
exports.normalizeToArray = normalizeToArray;
//# sourceMappingURL=xml.js.map