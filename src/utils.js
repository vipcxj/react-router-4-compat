export const some = (arr, pred) => {
  arr = arr || [];
  for (let i = 0; i < arr.length; ++i) {
    if (pred && pred(arr[i])) {
      return true;
    }
  }
  return false;
};

export const mapValues = (obj, mapper) => {
  if (!obj) {
    return obj;
  }
  if (!mapper) {
    return { ...obj };
  }
  const parts = Object.keys(obj).map(k => ({ [k]: mapper(obj[k], k, obj) }));
  return Object.assign({}, ...parts);
};

export const assignWith = (object, ...rest) => {
  if (rest.length === 0 || (rest.length === 1 && typeof rest[0] === 'function')) {
    return object;
  }
  let cumstomizer = rest[rest.length - 1];
  cumstomizer = typeof cumstomizer === 'function' ? cumstomizer : null;
  const sources = cumstomizer ? rest.slice(0, rest.length - 1) : rest;
  if (!cumstomizer) {
    return Object.assign(object, ...sources);
  } else {
    for (let i = 0; i < sources.length; ++i) {
      const source = sources[i];
      const newSources = Object
        .keys(source)
        .map(k => (
          {}.hasOwnProperty.call(object, k)
            ? { [k]: cumstomizer(object[k], source[k], k, object, source) }
            : { [k]: source[k] }
        ));
      Object.assign(object, ...newSources);
    }
    return object;
  }
};

export const castArray = (...args) => {
  if (args.length === 0) {
    return [];
  }
  return Array.isArray(args[0]) ? args[0] : [args[0]];
};
