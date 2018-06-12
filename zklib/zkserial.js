const dgram = require('dgram');

const {Commands} = require('./constants');

module.exports = class {
  serialNumber(cb) {
    const keyword = '~SerialNumber';

    this.executeCmd(Commands.DEVICE, keyword, (err, ret) => {
      if (err) {
        return cb(err);
      }

      return cb(
        null,
        ret
          .slice(8)
          .toString('ascii')
          .replace(keyword + '=', '')
      );
    });
  }
};
