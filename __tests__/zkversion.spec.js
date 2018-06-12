const ZKLib = require('../zklib/zklib');
const {Commands} = require('../zklib/constants');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('version', () => {
  test('when cmd success it should call callback without error', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.executeCmd = jest.fn((command, data, cb) => cb(null, Buffer.from('        ~ZKFPVersion=12345')));

    const callback = jest.fn();

    zk.version(callback);

    expect(zk.executeCmd).toBeCalledWith(Commands.DEVICE, '~ZKFPVersion', expect.any(Function));
    expect(callback).toBeCalledWith(null, '12345');
  });

  test('when executeCmd fails it should call callback with error', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.executeCmd = jest.fn((command, data, cb) => cb(new Error('some')));

    const callback = jest.fn();

    zk.version(callback);

    expect(zk.executeCmd).toBeCalledWith(Commands.DEVICE, '~ZKFPVersion', expect.any(Function));
    expect(callback).toBeCalledWith(new Error('some'));
  });
});
