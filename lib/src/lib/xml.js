"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xml2js = require("xml2js");
exports.builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    xmlns: true,
    renderOpts: { pretty: true, indent: '    ', newline: '\n' }
});
/* istanbul ignore next*/
function parseStringSync(str, explicitArray = true) {
    let result;
    xml2js.parseString(str, { explicitArray }, (e, r) => {
        result = r;
    });
    return result;
}
exports.parseStringSync = parseStringSync;
//# sourceMappingURL=xml.js.map