const dgram = require('dgram');

const { Commands } = require('./constants');

module.exports = class {
  version(cb) {
    const keyword = '~ZKFPVersion';

    this.executeCmd(Commands.DEVICE, keyword, (err, ret) => {
      if (err || !ret || ret.length <= 8) {
        return cb(err);
      }

      return cb(
        null,
        ret
          .slice(8)
          .toString('ascii')
          .split(/\u0000/)
          .shift()
          .replace(keyword + '=', '')
      );
    });
  }
};
