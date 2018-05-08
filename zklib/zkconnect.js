const dgram = require('dgram');

const { Commands } = require('./constants');

module.exports = class {
  connect(cb) {
    return this.executeCmd(Commands.CONNECT, '', cb);
  }

  disconnect(cb) {
    return this.executeCmd(Commands.EXIT, '', cb);
  }
};
