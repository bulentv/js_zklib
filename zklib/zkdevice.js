const { Commands } = require('./constants');

/**
 *
 * @param {string|Error} err
 * @param {Array} ret
 */
function checkCmdArgs(err, ret) {
  return err || !ret || ret.length < 8 ? err || 'response error' : undefined;
}

module.exports = class {
  /**
   * Enable the device
   * @param {(err: Error|string) => void} cb
   */
  enableDevice(cb) {
    this.executeCmd(Commands.ENABLEDEVICE, '', (err, ret) => {
      const errResult = checkCmdArgs(err, ret);

      if (errResult) {
        return cb(errResult);
      }

      return cb();
    });
  }

  /**
   * Disable the device
   * @param {(err: Error|string) => void} cb
   */
  disableDevice(cb) {
    const buffer = new Buffer([0, 0, 0, 0]);

    this.executeCmd(Commands.DISABLEDEVICE, buffer, (err, ret) => {
      const errResult = checkCmdArgs(err, ret);

      if (errResult) {
        return cb(errResult);
      }

      return cb();
    });
  }
};
