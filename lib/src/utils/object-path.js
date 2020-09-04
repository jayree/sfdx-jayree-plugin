"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectPath = exports.ObjectPathResolver = void 0;
const tslib_1 = require("tslib");
/*
 * Copyright (c) 2020, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const objectPath = tslib_1.__importStar(require("object-path"));
exports.objectPath = objectPath;
// tslint:disable-next-line: no-any
Array.prototype.equals = function (arr) {
    return this.length === arr.length && this.every((u, i) => u === arr[i]);
};
function compareobj(obj1, obj2) {
    // tslint:disable-next-line: no-any
    return (!Array.isArray(obj2) ? [obj2] : obj2).equals(!Array.isArray(obj1) ? [obj1] : obj1);
}
class ObjectPathResolver {
    constructor(object) {
        this._path = [];
        // eslint-disable-next-line no-underscore-dangle
        this._object = object;
    }
    value() {
        // eslint-disable-next-line no-underscore-dangle
        return this._path;
    }
    resolve({ path, key, value }) {
        // console.log({ path, key, value });
        // eslint-disable-next-line no-underscore-dangle
        if (this._path.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-for-in-array, no-underscore-dangle
            for (const i in this._path) {
                // eslint-disable-next-line no-underscore-dangle
                if (Array.isArray(objectPath.get(this._object, this._path[i]))) {
                    // eslint-disable-next-line no-underscore-dangle
                    this._path[i] = this._path[i] + '.' + i + '.' + path;
                }
                else {
                    // eslint-disable-next-line no-underscore-dangle
                    this._path[i] = this._path[i] + '.' + path;
                }
            }
            // console.log('nach 1. iteration');
            // console.log(this._path);
        }
        else {
            // eslint-disable-next-line no-underscore-dangle
            this._path.push(path);
            // console.log('nach push');
            // console.log(this._path);
        }
        const matchingPath = [];
        // eslint-disable-next-line no-underscore-dangle
        for (const currenpath of this._path) {
            // eslint-disable-next-line no-underscore-dangle
            const currentvalue = objectPath.get(this._object, currenpath);
            if (currentvalue) {
                if (value === undefined) {
                    if (currentvalue.length > 1) {
                        // eslint-disable-next-line guard-for-in
                        for (const i in currentvalue) {
                            matchingPath.push(`${currenpath}.${i}`);
                        }
                    }
                    else {
                        matchingPath.push(`${currenpath}`);
                    }
                }
                else if (key === undefined) {
                    if (compareobj(currentvalue, value)) {
                        matchingPath.push(currenpath);
                    }
                }
                else {
                    for (const i in currentvalue) {
                        // eslint-disable-next-line no-underscore-dangle
                        if (compareobj(objectPath.get(this._object, `${currenpath}.${i}.${key}`), value)) {
                            matchingPath.push(`${currenpath}.${i}`);
                        }
                    }
                }
            }
        }
        // eslint-disable-next-line no-underscore-dangle
        this._path = matchingPath;
        // console.log('nach matchinpath');
        // console.log(this._path);
        return this;
    }
    resolveString(string) {
        // console.log(string)
        // eslint-disable-next-line no-useless-escape
        string.match(/(?:[^\.\']+|\'[^\']*\')+/g).forEach((element) => {
            const query = {};
            // const e = element.split('?');
            const e = element.split(/(\[.*?\])/);
            // console.log(e);
            if (e.length === 1) {
                query.path = e[0];
            }
            else {
                query.path = e[0];
                const params = JSON.parse(e[1].replace(/'/g, '"'));
                if (params.length === 2) {
                    query.key = params[0];
                    query.value = params[1];
                }
                if (params.length === 1) {
                    query.value = params[0];
                }
            }
            // console.log(query);
            this.resolve(query);
        });
        return this;
    }
}
exports.ObjectPathResolver = ObjectPathResolver;
//# sourceMappingURL=object-path.js.map