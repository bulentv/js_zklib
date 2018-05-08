// jest.mock('../zklib/zklib');

const ZKLib = require('../zklib/zklib');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('enableDevice', () => {
  test('when cmd success it should call callback without error', () => {
    const zk = new ZKLib({ ip: '123', inport: 123 });

    zk.executeCmd = jest.fn((cmd, cmd_value, cb) => cb(undefined, new Array(8)));

    const callback = jest.fn();

    zk.enableDevice(callback);

    expect(callback).toBeCalledWith();
  });

  test('when cmd fails it should call callback with error', () => {
    const zk = new ZKLib({ ip: '123', inport: 123 });

    zk.executeCmd = jest.fn((cmd, cmd_value, cb) => cb('failed!'));

    const callback = jest.fn();

    zk.enableDevice(callback);

    expect(callback).toBeCalledWith('failed!');
  });

  test("when there's no response it should call callback with error", () => {
    const zk = new ZKLib({ ip: '123', inport: 123 });

    zk.executeCmd = jest.fn((cmd, cmd_value, cb) => cb(undefined, null));

    const callback = jest.fn();

    zk.enableDevice(callback);

    expect(callback).toBeCalledWith('response error');
  });

  test('when response its not valid it should call callback with error', () => {
    const zk = new ZKLib({ ip: '123', inport: 123 });

    zk.executeCmd = jest.fn((cmd, cmd_value, cb) => cb(undefined, new Array(7)));

    const callback = jest.fn();

    zk.enableDevice(callback);

    expect(callback).toBeCalledWith('response error');
  });
});

describe('disableDevice', () => {
  test('when cmd success it should call callback without error', () => {
    const zk = new ZKLib({ ip: '123', inport: 123 });

    zk.executeCmd = jest.fn((cmd, cmd_value, cb) => cb(undefined, new Array(8)));

    const callback = jest.fn();

    zk.disableDevice(callback);

    expect(callback).toBeCalledWith();
  });

  test('when cmd fails it should call callback with error', () => {
    const zk = new ZKLib({ ip: '123', inport: 123 });

    zk.executeCmd = jest.fn((cmd, cmd_value, cb) => cb('failed!'));

    const callback = jest.fn();

    zk.disableDevice(callback);

    expect(callback).toBeCalledWith('failed!');
  });

  test("when there's no response it should call callback with error", () => {
    const zk = new ZKLib({ ip: '123', inport: 123 });

    zk.executeCmd = jest.fn((cmd, cmd_value, cb) => cb(undefined, null));

    const callback = jest.fn();

    zk.disableDevice(callback);

    expect(callback).toBeCalledWith('response error');
  });

  test('when the response its not valid it should call callback with error', () => {
    const zk = new ZKLib({ ip: '123', inport: 123 });

    zk.executeCmd = jest.fn((cmd, cmd_value, cb) => cb(undefined, new Array(7)));

    const callback = jest.fn();

    zk.disableDevice(callback);

    expect(callback).toBeCalledWith('response error');
  });
});
