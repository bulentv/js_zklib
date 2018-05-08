const { decode, encode } = require('../zklib/timestamp_parser');

describe('parse', () => {
  test('should return a date', () => {
    expect(decode(587468120)).toEqual(new Date(2018, 4 - 1, 11, 9, 35, 20, 0));
  });
});

describe('encode', () => {
  test('should return a decimal', () => {
    expect(encode(new Date(2018, 4 - 1, 11, 9, 35, 20, 0))).toEqual(587468120);
  });
});
