const dgram = require('dgram');

const timeParser = require('./timestamp_parser');
const {Commands} = require('./constants');
const {checkValid} = require('./utils');

module.exports = class {
  /**
   *
   * @param {(error: Error, dateTime:Date) => void} [cb]
   */
  getTime(cb) {
    this.executeCmd(Commands.GET_TIME, '', (err, ret) => {
      if (err) return cb(err);

      return cb(null, timeParser.decode(ret.readUInt32LE(8)));
    });
  }

  /**
   *
   * @param {Date} dateTime
   * @param {(error: Error) => void} [cb]
   */
  setTime(dateTime, cb) {
    const command_string = Buffer.alloc(4);
    command_string.writeUInt32LE(timeParser.encode(dateTime), 0);

    this.executeCmd(Commands.SET_TIME, command_string, cb);
  }

  /**
   *
   * @param {(error: Error, data) => void} [cb]
   * @deprecated since version 0.2.0. Use getTime instead
   */
  gettime(cb) {
    console.warn('gettime() function will deprecated soon, please use getTime()');
    return this.getTime(cb);
  }

  /**
   *
   * @param {(error: Error) => void} [cb]
   * @deprecated since version 0.2.0. Use setTime instead
   */
  settime(cb) {
    console.warn('settime() function will deprecated soon, please use setTime()');
    return this.setTime(cb);
  }
};
