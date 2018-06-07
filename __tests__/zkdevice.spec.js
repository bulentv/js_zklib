// jest.mock('../zklib/zklib');

const ZKLib = require('../zklib/zklib');
const {Commands} = require('../zklib/constants');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('enableDevice', () => {
  test('when cmd success it should call callback without error', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.executeCmd = jest.fn();

    const callback = jest.fn();

    zk.enableDevice(callback);

    expect(zk.executeCmd).toBeCalledWith(Commands.ENABLE_DEVICE, '', callback);
  });
});

describe('disableDevice', () => {
  test('when cmd success it should call callback without error', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.executeCmd = jest.fn();

    const callback = jest.fn();

    zk.disableDevice(callback);

    expect(zk.executeCmd).toBeCalledWith(Commands.DISABLE_DEVICE, Buffer.from([0, 0, 0, 0]), callback);
  });
});
