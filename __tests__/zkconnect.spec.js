const ZKLib = require('../zklib/zklib');
const {Commands} = require('../zklib/constants');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('connect', () => {
  test('when cmd success it should call callback without error', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.createSocket = jest.fn(cb => cb());
    zk.executeCmd = jest.fn((command, data, cb) => cb());

    const mainCallback = jest.fn();

    zk.connect(mainCallback);

    expect(zk.createSocket).toBeCalled();
    expect(zk.executeCmd).toBeCalledWith(Commands.CONNECT, '', expect.any(Function));
    expect(mainCallback).toBeCalledWith();
  });

  test('when createSocket fails it should call callback with error', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.createSocket = jest.fn(cb => cb(new Error('some')));
    zk.executeCmd = jest.fn((command, data, cb) => cb());

    const mainCallback = jest.fn();

    zk.connect(mainCallback);

    expect(zk.createSocket).toBeCalled();
    expect(zk.executeCmd).not.toBeCalled();
    expect(mainCallback).toBeCalledWith(new Error('some'));
  });

  test('when executeCmd fails it should call callback with error', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.createSocket = jest.fn(cb => cb());
    zk.closeSocket = jest.fn();
    zk.executeCmd = jest.fn((command, data, cb) => cb(new Error('some')));

    const mainCallback = jest.fn();

    zk.connect(mainCallback);

    expect(zk.createSocket).toBeCalled();
    expect(zk.executeCmd).toBeCalled();
    expect(zk.closeSocket).toBeCalled();
    expect(mainCallback).toBeCalledWith(new Error('some'));
  });
});

describe('disconnect', () => {
  test('when cmd success it should call callback without error', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.executeCmd = jest.fn((command, data, cb) => cb());
    zk.closeSocket = jest.fn();

    const mainCallback = jest.fn();

    zk.disconnect(mainCallback);

    expect(zk.executeCmd).toBeCalledWith(Commands.EXIT, '', expect.any(Function));
    expect(zk.closeSocket).toBeCalled();
    expect(mainCallback).toBeCalledWith(undefined);
  });

  test('when executeCmd fails it should call callback with error', () => {
    const zk = new ZKLib({ip: '123', inport: 123});

    zk.executeCmd = jest.fn((command, data, cb) => cb(new Error('some')));
    zk.closeSocket = jest.fn();

    const mainCallback = jest.fn();

    zk.disconnect(mainCallback);

    expect(zk.executeCmd).toBeCalledWith(Commands.EXIT, '', expect.any(Function));
    expect(zk.closeSocket).toBeCalled();
    expect(mainCallback).toBeCalledWith(new Error('some'));
  });
});
