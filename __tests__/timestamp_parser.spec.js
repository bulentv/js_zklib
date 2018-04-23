const { decode, encode } = require('../zklib/timestamp_parser');

describe('parse', () => {
  test('should return a date', () => {
    expect(decode(587468120)).toEqual(new Date('2018-04-11T12:35:20.000Z'));
  });
});

describe('encode', () => {
  test('should return a decimal', () => {
    expect(encode(new Date('2018-04-11T12:35:20.000Z'))).toEqual(587468120);
  });
});
