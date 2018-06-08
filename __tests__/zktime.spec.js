const ZKLib = require('../zklib/zklib');
const {Commands} = require('../zklib/constants');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getTime', () => {
  test('when cmd success it should call callback without error', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    const buf = Buffer.alloc(8 + 4);
    buf.writeUInt32LE(587468120, 8);

    zk.executeCmd = jest.fn((command, data, cb) => cb(null, buf));

    const callback = jest.fn();

    zk.getTime(callback);

    expect(zk.executeCmd).toBeCalledWith(Commands.GET_TIME, '', expect.any(Function));
    expect(callback).toBeCalledWith(null, new Date(2018, 4 - 1, 11, 9, 35, 20, 0));
  });

  test('when executeCmd fails it should call callback with error', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.executeCmd = jest.fn((command, data, cb) => cb(new Error('some')));

    const callback = jest.fn();

    zk.getTime(callback);

    expect(zk.executeCmd).toBeCalledWith(Commands.GET_TIME, '', expect.any(Function));
    expect(callback).toBeCalledWith(new Error('some'));
  });
});

describe('setTime', () => {
  test('when cmd success it should call callback without error', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.executeCmd = jest.fn((command, data, cb) => cb(null));

    const callback = jest.fn();

    zk.setTime(new Date(2018, 4 - 1, 11, 9, 35, 20, 0), callback);

    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(587468120, 0);

    expect(zk.executeCmd).toBeCalledWith(Commands.SET_TIME, buf, expect.any(Function));
    expect(callback).toBeCalledWith(null);
  });

  test('when executeCmd fails it should call callback with error', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.executeCmd = jest.fn((command, data, cb) => cb(new Error('some')));

    const callback = jest.fn();

    zk.setTime(new Date(2018, 4 - 1, 11, 9, 35, 20, 0), callback);

    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(587468120, 0);

    expect(zk.executeCmd).toBeCalledWith(Commands.SET_TIME, buf, expect.any(Function));
    expect(callback).toBeCalledWith(new Error('some'));
  });
});

describe('gettime', () => {
  test('should call getTime', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.getTime = jest.fn();

    const callback = jest.fn();

    zk.gettime(callback);

    expect(zk.getTime).toBeCalledWith(callback);
  });
});

describe('settime', () => {
  test('should call setTime', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.setTime = jest.fn();

    const callback = jest.fn();
    const dateTime = new Date();

    zk.settime(dateTime, callback);

    expect(zk.setTime).toBeCalledWith(dateTime, callback);
  });
});
