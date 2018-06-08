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
    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(timeParser.encode(dateTime), 0);

    this.executeCmd(Commands.SET_TIME, buf, cb);
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
   * @param {Date} dateTime
   * @param {(error: Error) => void} [cb]
   * @deprecated since version 0.2.0. Use setTime instead
   */
  settime(dateTime, cb) {
    console.warn('settime() function will deprecated soon, please use setTime()');
    return this.setTime(dateTime, cb);
  }
};
