const dgram = require('dgram');

const {Commands} = require('./constants');

module.exports = class {
  /**
   *
   * @param {(error: Error) => void} [cb]
   */
  connect(cb) {
    console.log('connecting...');

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

        console.log('connected');

        cb();
      });
    });
  }

  /**
   *
   * @param {(error: Error) => void} [cb]
   */
  disconnect(cb) {
    console.log('disconnecting...');

    this.executeCmd(Commands.EXIT, '', err => {
      this.closeSocket();

      // console.log('listenerCount: ', this.socket.listenerCount(this.DATA_EVENT));

      console.log('disconnected');

      cb(err);
    });
  }
};
