const parse = require('../zklib/timestamp_parser');

describe('parse', () => {
  test('should return a date', () => {
    expect(parse(587468120)).toEqual(new Date('2018-04-11T12:35:20.000Z'));
  });
});
