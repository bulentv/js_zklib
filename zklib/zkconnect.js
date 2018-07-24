const dgram = require('dgram');

const {Commands} = require('./constants');

module.exports = class {
  /**
   *
   * @param {(error?: Error) => void} [cb]
   */
  connect(cb) {
    this.createSocket(err => {
      if (err) {
        cb(err);

        return;
      }

      this.executeCmd(Commands.CONNECT, '', err => {
        if (err) {
          this.closeSocket();

          cb(err);

          return;
        }

        cb();
      });
    });
  }

  /**
   *
   * @param {(error: Error) => void} [cb]
   */
  disconnect(cb) {
    this.executeCmd(Commands.EXIT, '', err => {
      this.closeSocket();

      cb(err);
    });
  }
};
