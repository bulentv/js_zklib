module.exports = (parentClass, mixinClass) => {
  const methods = Object.getOwnPropertyNames(mixinClass.prototype);

  for (let i = 0; i < methods.length; i++) {
    const method = methods[i];

    if (method == 'constructor') continue;

    if (parentClass.prototype[method]) {
      throw new Error(`Method ${method} is already implemented`);
    }

    parentClass.prototype[method] = mixinClass.prototype[method];
  }
};
