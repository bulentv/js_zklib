const ZKLib = require('../zklib/zklib');
const {Commands} = require('../zklib/constants');

beforeEach(() => {
  jest.clearAllMocks();
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
