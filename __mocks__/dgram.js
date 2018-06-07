const dgram = jest.genMockFromModule('dgram');

dgram.createSocket = jest.fn(() => {
  return {
    bind: jest.fn(() => {}),
    once: jest.fn(() => {}),
    on: jest.fn(() => {}),
    close: jest.fn(() => {}),
    send: jest.fn(() => {}),
    removeAllListeners: jest.fn(() => {}),
    removeListener: jest.fn(() => {})
  };
});

module.exports = dgram;
