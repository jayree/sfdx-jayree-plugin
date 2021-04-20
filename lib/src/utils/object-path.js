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
/* istanbul ignore file */
const objectPath = tslib_1.__importStar(require("object-path"));
exports.objectPath = objectPath;
function arrayEquals(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every((u, i) => u === arr2[i]);
}
function compareobj(obj1, obj2) {
    return arrayEquals(!Array.isArray(obj2) ? [obj2] : obj2, !Array.isArray(obj1) ? [obj1] : obj1);
}
class ObjectPathResolver {
    constructor(object) {
        this.path = [];
        this.object = object;
    }
    value() {
        if (this.returnPathBefore) {
            return this.path.map((x) => x.split(this.returnPathBefore)[0].slice(0, -1));
        }
        else {
            return this.path;
        }
    }
    resolve({ path, key, value }) {
        if (this.path.length > 0) {
            for (const [i, v] of this.path.entries()) {
                if (Array.isArray(objectPath.get(this.object, v))) {
                    this.path[i] = v + '.' + i + '.' + path;
                }
                else {
                    this.path[i] = v + '.' + path;
                }
            }
        }
        else {
            if (objectPath.get(this.object, path)) {
                this.path.push(path);
            }
            return this;
        }
        const matchingPath = [];
        for (const currenpath of this.path) {
            const currentvalue = objectPath.get(this.object, currenpath);
            if (currentvalue) {
                if (value === undefined) {
                    for (let i = 0; i < currentvalue.length; i++) {
                        matchingPath.push(`${currenpath}.${i}`);
                    }
                }
                else if (key === undefined) {
                    if (compareobj(currentvalue, value)) {
                        matchingPath.push(`${currenpath}`);
                    }
                    else {
                        if (currentvalue.includes(value)) {
                            matchingPath.push(`${currenpath}.${currentvalue.indexOf(value)}`);
                        }
                    }
                }
                else {
                    for (let i = 0; i < currentvalue.length; i++) {
                        let match = true;
                        for (const [k, v] of key.entries()) {
                            const obj2compare = objectPath.get(this.object, `${currenpath}.${i}.${v}`);
                            if (obj2compare) {
                                if (!compareobj(obj2compare, value[k])) {
                                    match = false;
                                }
                            }
                            else {
                                if (value[k] !== 'undefined') {
                                    match = false;
                                }
                            }
                        }
                        if (match) {
                            matchingPath.push(`${currenpath}.${i}`);
                        }
                    }
                }
            }
        }
        this.path = matchingPath;
        return this;
    }
    resolveString(string) {
        // eslint-disable-next-line no-useless-escape
        string.match(/(?:[^\.\']+|\'[^\']*\')+/g).forEach((element) => {
            const query = {};
            const e = element.split(/(\[.*\])/);
            if (e.length === 1) {
                query.path = e[0];
            }
            else {
                query.path = e[0];
                const params = JSON.parse(e[1].replace(/'/g, '"'));
                if (params.length >= 2) {
                    if (Array.isArray(params[0])) {
                        query.key = params.map((x) => x[0]);
                        query.value = params.map((x) => x[1]);
                    }
                    else {
                        query.key = [params[0]];
                        query.value = [params[1]];
                    }
                }
                if (params.length === 1) {
                    query.value = params[0];
                }
            }
            if (query.path.charAt(0) === '?') {
                query.path = query.path.slice(1);
                this.returnPathBefore = query.path;
            }
            this.resolve(query);
        });
        return this;
    }
}
exports.ObjectPathResolver = ObjectPathResolver;
//# sourceMappingURL=object-path.js.map