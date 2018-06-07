jest.mock('dgram');

jest.mock('../zklib/att_parser_legacy');
jest.mock('../zklib/att_parser_v6.60');

const dgram = require('dgram');

const ZKLib = require('../zklib/zklib');
const attendanceLegacyParser = require('../zklib/att_parser_legacy');
const attendanceV660Parser = require('../zklib/att_parser_v6.60');

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

  describe('getAttendances', () => {
    test('when send returns an error it should return', done => {
      const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60'});

      zk.data_recv = Buffer.from(new Array(10));
      zk.socket = dgram.createSocket('udp4');

      zk.send = (msg, offset, length, cb) => {
        cb('some error');
      };

      zk.getAttendance(err => {
        expect(err).toBe('some error');
        done();
      });
    });
  });
});
