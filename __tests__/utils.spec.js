const { defaultTo } = require('../zklib/utils');

describe('defaultTo', () => {
  test('when is undefined should return default value', () => {
    expect(defaultTo(undefined, 1)).toBe(1);
  });

  test('when is null should return the value', () => {
    expect(defaultTo(null, 1)).toBe(null);
  });

  test('when is empty should return the value', () => {
    expect(defaultTo('', 'default')).toBe('');
    expect(defaultTo(0, 1)).toBe(0);
  });
});
