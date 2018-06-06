const dgram = require('dgram');

const timeParser = require('./timestamp_parser');
const { Commands } = require('./constants');
const { checkValid } = require('./utils');

module.exports = class {
  getTime(cb) {
    this.executeCmd(Commands.GET_TIME, '', (err, ret) => {
      if (err || !ret || ret.length <= 8) return cb(err);

      return cb(null, timeParser.decode(ret.readUInt32LE(8)));
    });
  }

  setTime(date, cb) {
    const command_string = new Buffer(4);
    command_string.writeUInt32LE(timeParser.encode(date), 0);

    this.executeCmd(Commands.SET_TIME, command_string, (err, ret) => {
      if (err || !ret || ret.length <= 8) {
        return cb(err);
      }

      return cb(checkValid(ret) ? null : 'Invalid request', ret);
    });
  }

  // Deprecation warnings
  gettime(cb) {
    console.warn('gettime() function will deprecated soon, please use getTime()');
    return this.getTime(cb);
  }

  settime(cb) {
    console.warn('settime() function will deprecated soon, please use setTime()');
    return this.setTime(cb);
  }
};
