/* eslint-disable no-underscore-dangle */

const VALUES = {
  boolean: Boolean,
  // quick safe parser - there may be a similar util somewhere already
  json: (str) => {
    try {
      return JSON.parse(str);
    } catch (err) {
      return {};
    }
  },
  number: Number,
  string: String,
};

const updateObjProp = (obj, value, propPath) => {
  const [head, ...rest] = propPath.split('.');
  if (!obj[head]) {
    obj[head] = {};
  }
  !rest.length
    ? (obj[head] = value)
    : updateObjProp(obj[head], value, rest.join('.'));
};

const ref = document.currentScript.dataset.wagtailMetadata;

document.currentScript._METADATA = [...document.querySelectorAll(`[${ref}]`)]
  .map((element) => ({
    path: element.name,
    rawValue: element.content || '',
    valueType: element.getAttribute(ref) || 'string',
  }))
  .filter(({ path }) => !!path)
  .reduce((metadata, { path, rawValue, valueType = 'string' }) => {
    const value = VALUES[valueType](rawValue);
    updateObjProp(metadata, value, path);
    return metadata;
  }, {});

Object.freeze(document.currentScript._METADATA);
