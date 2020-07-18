import * as objectPath from 'object-path';

// tslint:disable-next-line: no-any
(Array.prototype as any).equals = function (arr) {
  return this.length === arr.length && this.every((u, i) => u === arr[i]);
};

function compareobj(obj1, obj2) {
  // tslint:disable-next-line: no-any
  return ((!Array.isArray(obj2) ? [obj2] : obj2) as any).equals(!Array.isArray(obj1) ? [obj1] : obj1);
}

interface QueryParameters {
  path;
  key?;
  value?;
}

class ObjectPathResolver {
  _path = [];
  _object;

  constructor(object) {
    this._object = object;
  }

  value() {
    return this._path;
  }

  resolve({ path, key, value }: QueryParameters) {
    // console.log({ path, key, value });
    if (this._path.length > 0) {
      for (const i in this._path) {
        if (Array.isArray(objectPath.get(this._object, this._path[i]))) {
          this._path[i] = this._path[i] + '.' + i + '.' + path;
        } else {
          this._path[i] = this._path[i] + '.' + path;
        }
      }
      // console.log('nach 1. iteration');
      // console.log(this._path);
    } else {
      this._path.push(path);
      // console.log('nach push');
      // console.log(this._path);
    }

    const matchingPath = [];

    for (const currenpath of this._path) {
      const currentvalue = objectPath.get(this._object, currenpath);
      if (currentvalue) {
        if (value === undefined) {
          if (currentvalue.length > 1) {
            for (const i in currentvalue) {
              if (currentvalue.hasOwnProperty(i)) {
                matchingPath.push(`${currenpath}.${i}`);
              }
            }
          } else {
            matchingPath.push(`${currenpath}`);
          }
        } else if (key === undefined) {
          if (compareobj(currentvalue, value)) {
            matchingPath.push(currenpath);
          }
        } else {
          for (const i in currentvalue) {
            if (compareobj(objectPath.get(this._object, `${currenpath}.${i}.${key}`), value)) {
              matchingPath.push(`${currenpath}.${i}`);
            }
          }
        }
      }
    }
    this._path = matchingPath;
    // console.log('nach matchinpath');
    // console.log(this._path);

    return this;
  }

  resolveString(string) {
    // console.log(string)
    string.match(/(?:[^\.\']+|\'[^\']*\')+/g).forEach((element) => {
      const query = {} as QueryParameters;
      // const e = element.split('?');
      const e = element.split(/(\[.*?\])/);
      // console.log(e);
      if (e.length === 1) {
        query.path = e[0];
      } else {
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

export { ObjectPathResolver, objectPath };
