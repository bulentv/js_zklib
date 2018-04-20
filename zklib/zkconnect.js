const dgram = require('dgram');

module.exports = class {
  connect(cb) {
    return this.executeCmd( this.Commands.CONNECT, '', cb );
  }

  disconnect(cb) {
    return this.executeCmd( this.Commands.EXIT, '', cb );
  }
};
