jest.mock('dgram');
jest.mock('net');

const dgram = require('dgram');
const net = require('net');

const ZKLib = require('../zklib/zklib');
const {Commands} = require('../zklib/constants');
const {hexStringToBuffer} = require('../zklib/utils');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getUsers', () => {
  test('should call send with get cmd', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.socket = dgram.createSocket('udp4');

    zk.send = jest.fn();

    zk.getUser();

    expect(zk.socket.on).toBeCalledWith('message', expect.any(Function));
    expect(zk.send).toBeCalledWith(
      Buffer.from([0x09, 0x00, 0xf0, 0xff, 0x00, 0x00, 0x00, 0x00, 0x05]),
      0,
      9,
      expect.any(Function)
    );
  });

  test('when send returns an error it should return', done => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.socket = dgram.createSocket('udp4');

    zk.send = (msg, offset, length, cb) => {
      cb('some error');
    };

    zk.getUser(err => {
      expect(err).toBe('some error');
      done();
    });
  });

  test('when udp should parse data with two message', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.socket = dgram.createSocket('udp4');

    let handleOnCallback;

    zk.socket.on = jest.fn((event, cb) => {
      handleOnCallback = cb;
    });

    const dataBuf1 = hexStringToBuffer(
      '000200003336393000000000426574736162650000000000000000000000000000000000000000000101000000000000003200000000000000000000000000000000000000000000'
    );
    const dataBuf2 = hexStringToBuffer(
      '000300003234363800000000330074736162650000000000000000000000000000000000000000000101000000000000003300000000000000000000000000000000000000000000'
    );
    const dataBuf3 = hexStringToBuffer(
      '0004000e31313930000000005269636172646f0000000000000000000000000000000000000000000101000000000000003400000000000000000000000000000000000000000000'
    );

    zk.send = jest.fn(() => {
      handleOnCallback(hexStringToBuffer('dc0546f900000100dc00000000040000'));

      handleOnCallback(
        Buffer.from([...hexStringToBuffer('dd05ae2b00000200dc0000'), ...dataBuf1, ...dataBuf2, ...dataBuf3, 0x00, 0x00])
      );
    });

    zk.decodeUserData = jest.fn(data => data);

    const callback = jest.fn();

    zk.getUser(callback);

    expect(callback).toBeCalledWith(null, [dataBuf1, dataBuf2, dataBuf3]);
  });

  test('when udp should parse data with more than two message', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.socket = dgram.createSocket('udp4');

    let handleOnCallback;

    zk.socket.on = jest.fn((event, cb) => {
      handleOnCallback = cb;
    });

    const dataBuf1 = hexStringToBuffer(
      '000200003336393000000000426574736162650000000000000000000000000000000000000000000101000000000000003200000000000000000000000000000000000000000000'
    );
    const dataBuf2 = hexStringToBuffer(
      '000300003234363800000000330074736162650000000000000000000000000000000000000000000101000000000000003300000000000000000000000000000000000000000000'
    );

    zk.send = jest.fn(() => {
      handleOnCallback(hexStringToBuffer('dc0546f9000001009400000000040000'));

      handleOnCallback(Buffer.from([...hexStringToBuffer('dd05ae2b00000200940000'), ...dataBuf1]));

      handleOnCallback(Buffer.from([...hexStringToBuffer('dd05948301000200'), ...dataBuf2, 0x00, 0x00]));
    });

    zk.decodeUserData = jest.fn(data => data);

    const callback = jest.fn();

    zk.getUser(callback);

    expect(callback).toBeCalledWith(null, [dataBuf1, dataBuf2]);
  });

  test('when udp should parse data with more than two message with partial data', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.socket = dgram.createSocket('udp4');

    let handleOnCallback;

    zk.socket.on = jest.fn((event, cb) => {
      handleOnCallback = cb;
    });

    const dataBuf1 = hexStringToBuffer(
      '000200003336393000000000426574736162650000000000000000000000000000000000000000000101000000000000003200000000000000000000000000000000000000000000'
    );
    const dataBuf2Part1 = hexStringToBuffer('000300003234363800000000330074736162650000000000000000000000000000000000');
    const dataBuf2Part2 = hexStringToBuffer('000000000101000000000000003300000000000000000000000000000000000000000000');
    const dataBuf3 = hexStringToBuffer(
      '0004000e31313930000000005269636172646f0000000000000000000000000000000000000000000101000000000000003400000000000000000000000000000000000000000000'
    );

    zk.send = jest.fn(() => {
      handleOnCallback(hexStringToBuffer('dc0546f900000100dc00000000040000'));

      handleOnCallback(Buffer.from([...hexStringToBuffer('dd05ae2b00000200dc0000'), ...dataBuf1, ...dataBuf2Part1]));

      handleOnCallback(
        Buffer.from([...hexStringToBuffer('dd05948301000200'), ...dataBuf2Part2, ...dataBuf3, 0x00, 0x00])
      );
    });

    zk.decodeUserData = jest.fn(data => data);

    const callback = jest.fn();

    zk.getUser(callback);

    expect(callback).toBeCalledWith(null, [dataBuf1, Buffer.from([...dataBuf2Part1, ...dataBuf2Part2]), dataBuf3]);
  });
});

describe('getuser', () => {
  test('should call getUser', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.getUser = jest.fn();

    const callback = jest.fn();

    zk.getuser(callback);

    expect(zk.getUser).toBeCalledWith(callback);
  });
});

describe('enrolluser', () => {
  test('should call enrollUser', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.enrollUser = jest.fn();

    const callback = jest.fn();

    zk.enrolluser(12, callback);

    expect(zk.enrollUser).toBeCalledWith(12, callback);
  });
});

describe('setuser', () => {
  test('should call setUser', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.setUser = jest.fn();

    const callback = jest.fn();

    zk.setuser(12, '123', 'name', 456, callback);

    expect(zk.setUser).toBeCalledWith(12, '123', 'name', 456, callback);
  });
});

describe('deluser', () => {
  test('should call delUser', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.delUser = jest.fn();

    const callback = jest.fn();

    zk.deluser(12, callback);

    expect(zk.delUser).toBeCalledWith(12, callback);
  });
});
