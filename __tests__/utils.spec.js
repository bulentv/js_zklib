const {
  defaultTo,
  createHeader,
  createChkSum,
  checkValid,
  removeTcpHeader,
  hexStringToBuffer,
} = require('../zklib/utils');

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

describe('createHeader', () => {
  test('should return a buffer with no data 1', () => {
    expect(createHeader(1000, 0, 65534, '')).toEqual(Buffer.from([0xe8, 0x03, 0x17, 0xfc, 0x00, 0x00, 0x00, 0x00]));
  });

  test('should return a buffer with no data 2', () => {
    expect(createHeader(13, 62840, 0, Buffer.from([]))).toEqual(
      Buffer.from([0x0d, 0x00, 0x79, 0x0a, 0x78, 0xf5, 0x01, 0x00])
    );
  });

  test('should return a buffer with no data 3', () => {
    expect(createHeader(1001, 62840, 0, '')).toEqual(Buffer.from([0xe9, 0x03, 0x9d, 0x06, 0x78, 0xf5, 0x01, 0x00]));
  });

  test('should return a buffer with data', () => {
    expect(createHeader(11, 63948, 0, '~SerialNumber')).toEqual(
      Buffer.from([
        ...[0x0b, 0x00, 0x23, 0xbd, 0xcc, 0xf9, 0x01, 0x00, 0x7e, 0x53, 0x65],
        ...[0x72, 0x69, 0x61, 0x6c, 0x4e, 0x75, 0x6d, 0x62, 0x65, 0x72],
      ])
    );
  });

  test('when theres a prefix it should return a buffer with the prefix a the beginning, with no data', () => {
    expect(createHeader(13, 62840, 0, Buffer.from([]), Buffer.from([0x87, 0x65, 0x43, 0x21]))).toEqual(
      Buffer.from([0x87, 0x65, 0x43, 0x21, 0x0d, 0x00, 0x79, 0x0a, 0x78, 0xf5, 0x01, 0x00])
    );
  });

  test('when theres a prefix it should return a buffer with the prefix a the beginning, with data', () => {
    expect(
      createHeader(13, 62840, 0, Buffer.from([0x12, 0x34, 0x56, 0x78]), Buffer.from([0x87, 0x65, 0x43, 0x21]))
    ).toEqual(
      Buffer.from([0x87, 0x65, 0x43, 0x21, 0x0d, 0x00, 0x10, 0x5e, 0x78, 0xf5, 0x01, 0x00, 0x12, 0x34, 0x56, 0x78])
    );
  });

  test('when the prefix is "tcp" it should return a buffer with the prefix a the beginning', () => {
    expect(createHeader(13, 62840, 0, Buffer.from([]), 'tcp')).toEqual(
      Buffer.from([0x50, 0x50, 0x82, 0x7d, 0x08, 0x00, 0x00, 0x00, 0x0d, 0x00, 0x79, 0x0a, 0x78, 0xf5, 0x01, 0x00])
    );
  });

  test('when the prefix is "udp" it should return a buffer without a prefix at the beginning', () => {
    expect(createHeader(13, 62840, 0, Buffer.from([]), 'udp')).toEqual(
      Buffer.from([0x0d, 0x00, 0x79, 0x0a, 0x78, 0xf5, 0x01, 0x00])
    );
  });
});

describe('createChkSum', () => {
  test('should return the calculated checksum 1', () => {
    expect(createChkSum(Buffer.from([0xe8, 0x03, 0x00, 0x00, 0x00, 0x00, 0xfe, 0xff]))).toEqual(64535);
  });

  test('should return the calculated checksum 2', () => {
    expect(createChkSum(Buffer.from([0x0d, 0x00, 0x00, 0x00, 0x1c, 0xfe, 0x00, 0x00]))).toEqual(469);
  });

  test('should return the calculated checksum 3', () => {
    expect(createChkSum(Buffer.from([0x0d, 0x00, 0x00, 0x00, 0xa6, 0xff, 0x00, 0x00]))).toEqual(75);
  });
});

describe('checkValid', () => {
  test('should return is valid', () => {
    expect(checkValid(Buffer.from([0xd0, 0x07, 0x00, 0x00]))).toEqual(true);
  });

  test('should return is valid', () => {
    expect(checkValid(Buffer.from([0xd5, 0x07, 0x00, 0x00]))).toEqual(true);
  });

  test('should return is invalid', () => {
    expect(checkValid(Buffer.from([0x0d, 0x00, 0x00, 0x00]))).toEqual(false);
  });
});

describe('removeTcpHeader', () => {
  test('should remove tcp header when is present', () => {
    expect(
      removeTcpHeader(Buffer.from([0x50, 0x50, 0x82, 0x7d, 0x08, 0x00, 0x00, 0x00, 0xd1, 0x07, 0x0c, 0x2b]))
    ).toEqual(Buffer.from([0xd1, 0x07, 0x0c, 0x2b]));
  });

  test('should not remove tcp header when buffer is smaller than 8', () => {
    expect(removeTcpHeader(Buffer.from([0x50, 0x50, 0x82, 0x7d, 0x08, 0x00, 0x00]))).toEqual(
      Buffer.from([0x50, 0x50, 0x82, 0x7d, 0x08, 0x00, 0x00])
    );
  });

  test('should not remove tcp header when is not present', () => {
    expect(
      removeTcpHeader(Buffer.from([0xd1, 0x07, 0x0c, 0x2b, 0x08, 0x00, 0x00, 0x00, 0xd1, 0x07, 0x0c, 0x2b]))
    ).toEqual(Buffer.from([0xd1, 0x07, 0x0c, 0x2b, 0x08, 0x00, 0x00, 0x00, 0xd1, 0x07, 0x0c, 0x2b]));
  });
});

describe('hexStringToBuffer', () => {
  test('should return the hexString as buffer', () => {
    expect(hexStringToBuffer('dd05ae2b00000200207b')).toEqual(
      Buffer.from([0xdd, 0x05, 0xae, 0x2b, 0x00, 0x00, 0x02, 0x00, 0x20, 0x7b])
    );
  });
});
