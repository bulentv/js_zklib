const { name, parse } = require('../zklib/att_parser_legacy');

test('name should be legacy', () => {
  expect(name).toBe('legacy');
});

describe('parse', () => {
  test('should return a attendance', () => {
    const buffer = Buffer.from([
      ...[0x34, 0x00, 0x00, 0x00, 0x32, 0x38, 0x32, 0x00, 0x00, 0x00, 0x00, 0x00],
      ...[0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
      ...[0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x58, 0x0d, 0x04, 0x23, 0x01]
    ]);

    expect(parse(buffer)).toEqual({ id: 282, uid: 4, state: 1, timestamp: new Date(2018, 4 - 1, 11, 9, 35, 20, 0) });
  });
});
