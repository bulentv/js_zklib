jest.mock('dgram');
jest.mock('net');

jest.mock('../zklib/att_parser_legacy');
jest.mock('../zklib/att_parser_v6.60');

const dgram = require('dgram');
const net = require('net');

const ZKLib = require('../zklib/zklib');
const attendanceLegacyParser = require('../zklib/att_parser_legacy');
const attendanceV660Parser = require('../zklib/att_parser_v6.60');
const {hexStringToBuffer} = require('../zklib/utils');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('decodeAttendanceData', () => {
  test('when no attendanceParser option is specify it should use the legacy parser', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    const buffer = Buffer.from([]);

    zk.decodeAttendanceData(buffer);

    expect(attendanceLegacyParser.parse).toBeCalledWith(buffer);
    expect(attendanceV660Parser.parse).not.toBeCalled();
  });

  test('when the attendanceParser option is legacy it should use the legacy parser', () => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'legacy'});

    const buffer = Buffer.from([]);

    zk.decodeAttendanceData(buffer);

    expect(attendanceLegacyParser.parse).toBeCalledWith(buffer);
    expect(attendanceV660Parser.parse).not.toBeCalled();
  });

  test('when the attendanceParser option is v6.60 it should use the v6.60 parser', () => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60'});

    const buffer = Buffer.from([]);

    zk.decodeAttendanceData(buffer);

    expect(attendanceV660Parser.parse).toBeCalledWith(buffer);
    expect(attendanceLegacyParser.parse).not.toBeCalled();
  });
});

describe('getAttendances', () => {
  test('should call send with get cmd', () => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60'});

    zk.socket = dgram.createSocket('udp4');

    zk.send = jest.fn();

    zk.getAttendance();

    expect(zk.socket.on).toBeCalledWith('message', expect.any(Function));
    expect(zk.send).toBeCalledWith(
      Buffer.from([0x0d, 0x00, 0xf1, 0xff, 0x00, 0x00, 0x00, 0x00]),
      0,
      8,
      expect.any(Function)
    );
  });

  test('when send returns an error it should return', done => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60'});

    zk.socket = dgram.createSocket('udp4');

    zk.send = (msg, offset, length, cb) => {
      cb('some error');
    };

    zk.getAttendance(err => {
      expect(err).toBe('some error');
      done();
    });
  });

  test('when udp should parse data with two message', () => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60'});

    zk.socket = dgram.createSocket('udp4');

    let handleOnCallback;

    zk.socket.on = jest.fn((event, cb) => {
      handleOnCallback = cb;
    });

    const attBuf1 = hexStringToBuffer(
      '000006023232000000000000000000000000000000000000000000000f82672d2300000000000000'
    );
    const attBuf2 = hexStringToBuffer(
      '000007023232000000000000000000000000000000000000000000000f01822d2300000000000000'
    );
    const attBuf3 = hexStringToBuffer(
      '000008023232000000000000000000000000000000000000000000000f40203a2300000000000000'
    );

    zk.send = jest.fn(() => {
      handleOnCallback(
        Buffer.from([0xdc, 0x05, 0xab, 0x13, 0x52, 0x67, 0x02, 0x00, 0x7c, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00])
      );

      handleOnCallback(
        Buffer.from([...hexStringToBuffer('dd05ae2b000002007c00'), ...attBuf1, ...attBuf2, ...attBuf3, 0x00, 0x00])
      );
    });

    attendanceV660Parser.parse = jest.fn(data => data);

    const callback = jest.fn();

    zk.getAttendance(callback);

    expect(callback).toBeCalledWith(null, [attBuf1, attBuf2, attBuf3]);
  });

  test('when udp should parse data with more than two message', () => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60'});

    zk.socket = dgram.createSocket('udp4');

    let handleOnCallback;

    zk.socket.on = jest.fn((event, cb) => {
      handleOnCallback = cb;
    });

    const attBuf1 = hexStringToBuffer(
      '000006023232000000000000000000000000000000000000000000000f82672d2300000000000000'
    );
    const attBuf2 = hexStringToBuffer(
      '000007023232000000000000000000000000000000000000000000000f01822d2300000000000000'
    );

    zk.send = jest.fn(() => {
      handleOnCallback(
        Buffer.from([0xdc, 0x05, 0xab, 0x13, 0x52, 0x67, 0x02, 0x00, 0x54, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00])
      );

      handleOnCallback(Buffer.from([...hexStringToBuffer('dd05ae2b000002005400'), ...attBuf1]));

      handleOnCallback(Buffer.from([...hexStringToBuffer('dd05948301000200'), ...attBuf2, 0x00, 0x00]));
    });

    attendanceV660Parser.parse = jest.fn(data => data);

    const callback = jest.fn();

    zk.getAttendance(callback);

    expect(callback).toBeCalledWith(null, [attBuf1, attBuf2]);
  });

  test('when udp should parse data with more than two message with partial data', () => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60'});

    zk.socket = dgram.createSocket('udp4');

    let handleOnCallback;

    zk.socket.on = jest.fn((event, cb) => {
      handleOnCallback = cb;
    });

    const attBuf1 = hexStringToBuffer(
      '000006023232000000000000000000000000000000000000000000000f82672d2300000000000000'
    );
    const attBuf2Part1 = hexStringToBuffer('000007023232000000000000000000000000');
    const attBuf2Part2 = hexStringToBuffer('000000000000000000000f01822d2300000000000000');
    const attBuf3 = hexStringToBuffer(
      '000008023232000000000000000000000000000000000000000000000f01822d2300000000000000'
    );

    zk.send = jest.fn(() => {
      handleOnCallback(
        Buffer.from([0xdc, 0x05, 0xab, 0x13, 0x52, 0x67, 0x02, 0x00, 0x7c, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00])
      );

      handleOnCallback(Buffer.from([...hexStringToBuffer('dd05ae2b000002007c00'), ...attBuf1, ...attBuf2Part1]));

      handleOnCallback(
        Buffer.from([...hexStringToBuffer('dd05948301000200'), ...attBuf2Part2, ...attBuf3, 0x00, 0x00])
      );
    });

    attendanceV660Parser.parse = jest.fn(data => data);

    const callback = jest.fn();

    zk.getAttendance(callback);

    expect(callback).toBeCalledWith(null, [attBuf1, Buffer.from([...attBuf2Part1, ...attBuf2Part2]), attBuf3]);
  });

  test('when tcp should parse data with two message', () => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60', connectionType: 'tcp'});

    zk.socket = new net.Socket();

    let handleOnCallback;

    zk.socket.on = jest.fn((event, cb) => {
      handleOnCallback = cb;
    });

    const attBuf1 = hexStringToBuffer(
      '000006023232000000000000000000000000000000000000000000000f82672d2300000000000000'
    );
    const attBuf2 = hexStringToBuffer(
      '000007023232000000000000000000000000000000000000000000000f01822d2300000000000000'
    );
    const attBuf3 = hexStringToBuffer(
      '000008023232000000000000000000000000000000000000000000000f40203a2300000000000000'
    );

    zk.send = jest.fn(() => {
      handleOnCallback(hexStringToBuffer('5050827d10000000' + 'dc05ab13526702007c00000000040000'));

      handleOnCallback(
        Buffer.from([
          ...hexStringToBuffer('5050827d949a0000' + 'dd05ae2b000002007c00'),
          ...attBuf1,
          ...attBuf2,
          ...attBuf3,
          0x00,
          0x00,
        ])
      );
    });

    attendanceV660Parser.parse = jest.fn(data => data);

    const callback = jest.fn();

    zk.getAttendance(callback);

    expect(callback).toBeCalledWith(null, [attBuf1, attBuf2, attBuf3]);
  });

  test('when tcp should parse data with more than two message', () => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60', connectionType: 'tcp'});

    zk.socket = new net.Socket();

    let handleOnCallback;

    zk.socket.on = jest.fn((event, cb) => {
      handleOnCallback = cb;
    });

    const attBuf1 = hexStringToBuffer(
      '000006023232000000000000000000000000000000000000000000000f82672d2300000000000000'
    );
    const attBuf2 = hexStringToBuffer(
      '000007023232000000000000000000000000000000000000000000000f01822d2300000000000000'
    );
    const attBuf3 = hexStringToBuffer(
      '000008023232000000000000000000000000000000000000000000000f01822d2300000000000000'
    );

    zk.send = jest.fn(() => {
      handleOnCallback(hexStringToBuffer('5050827d10000000' + 'dc05ab13526702007c00000000040000'));

      handleOnCallback(Buffer.from([...hexStringToBuffer('5050827d949a0000' + 'dd05717f000002007c00'), ...attBuf1]));
      handleOnCallback(attBuf2);
      handleOnCallback(Buffer.from([...attBuf3, 0x00, 0x00]));
    });

    attendanceV660Parser.parse = jest.fn(data => data);

    const callback = jest.fn();

    zk.getAttendance(callback);

    expect(callback).toBeCalledWith(null, [attBuf1, attBuf2, attBuf3]);
  });

  test('when tcp should parse data with more than two message with partial data', () => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60', connectionType: 'tcp'});

    zk.socket = new net.Socket();

    let handleOnCallback;

    zk.socket.on = jest.fn((event, cb) => {
      handleOnCallback = cb;
    });

    const attBuf1 = hexStringToBuffer(
      '000006023232000000000000000000000000000000000000000000000f82672d2300000000000000'
    );
    const attBuf2Part1 = hexStringToBuffer('0000070232320000000000000000000000000000');
    const attBuf2Part2 = hexStringToBuffer('00000000000000000f01822d2300000000000000');
    const attBuf3 = hexStringToBuffer(
      '000008023232000000000000000000000000000000000000000000000f01822d2300000000000000'
    );

    zk.send = jest.fn(() => {
      handleOnCallback(hexStringToBuffer('5050827d10000000' + 'dc05ab13526702007c00000000040000'));

      handleOnCallback(
        Buffer.from([...hexStringToBuffer('5050827d949a0000' + 'dd05717f000002007c00'), ...attBuf1, ...attBuf2Part1])
      );

      handleOnCallback(
        Buffer.from([...attBuf2Part2, ...attBuf3, 0x00, 0x00, ...hexStringToBuffer('5050827d08000000d007a15d8c9a0200')])
      );
    });

    attendanceV660Parser.parse = jest.fn(data => data);

    const callback = jest.fn();

    zk.getAttendance(callback);

    expect(callback).toBeCalledWith(null, [attBuf1, Buffer.from([...attBuf2Part1, ...attBuf2Part2]), attBuf3]);
  });

  test('when tcp should parse data with one message', () => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60', connectionType: 'tcp'});

    zk.socket = new net.Socket();

    let handleOnCallback;

    zk.socket.on = jest.fn((event, cb) => {
      handleOnCallback = cb;
    });

    const attBuf1 = hexStringToBuffer(
      '000006023232000000000000000000000000000000000000000000000f82672d2300000000000000'
    );
    const attBuf2 = hexStringToBuffer(
      '000007023232000000000000000000000000000000000000000000000f01822d2300000000000000'
    );
    const attBuf3 = hexStringToBuffer(
      '000008023232000000000000000000000000000000000000000000000f40203a2300000000000000'
    );

    zk.send = jest.fn(() => {
      handleOnCallback(
        Buffer.from([
          ...hexStringToBuffer('5050827d10000000' + 'dc05ab13526702007c00000000040000'),
          ...hexStringToBuffer('5050827d949a0000' + 'dd05ae2b000002007c00'),
          ...attBuf1,
          ...attBuf2,
          ...attBuf3,
          0x00,
          0x00,
        ])
      );
    });

    attendanceV660Parser.parse = jest.fn(data => data);

    const callback = jest.fn();

    zk.getAttendance(callback);

    expect(callback).toBeCalledWith(null, [attBuf1, attBuf2, attBuf3]);
  });
});

describe('getattendance', () => {
  test('should call getAttendance', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.getAttendance = jest.fn();

    const callback = jest.fn();

    zk.getattendance(callback);

    expect(zk.getAttendance).toBeCalledWith(callback);
  });
});
