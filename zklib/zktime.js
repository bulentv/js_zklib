const dgram = require('dgram');
const timeParser = require('./timestamp_parser');

module.exports = class {
  getTime(cb) {
    this.executeCmd(this.Commands.GET_TIME, '', (err, ret) => {
      if (err || !ret || ret.length <= 8) return cb(err);

      return cb(null, timeParser.decode(ret.readUInt32LE(8)));
    });
  }

  setTime(date, cb) {
    const command_string = new Buffer(4);
    command_string.writeUInt32LE(timeParser.encode(date), 0);

    this.executeCmd(this.Commands.SET_TIME, command_string, (err, ret) => {
      if (err || !ret || ret.length <= 8) {
        return cb(err);
      }

      return cb(this.checkValid(ret) ? null : 'Invalid request', ret);
    });
  }

  // Deprecation warnings
  gettime(cb) {
    console.error('gettime() function will deprecated soon, please use getTime()');
    return this.getTime(cb);
  }

  settime(cb) {
    console.error('settime() function will deprecated soon, please use setTime()');
    return this.setTime(cb);
  }
};
