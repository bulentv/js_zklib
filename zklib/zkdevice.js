const {Commands} = require('./constants');

module.exports = class {
  /**
   * Enable the device
   * @param {(err: Error) => void} cb
   */
  enableDevice(cb) {
    this.executeCmd(Commands.ENABLE_DEVICE, '', cb);
  }

  /**
   * Disable the device
   * @param {(err: Error) => void} cb
   */
  disableDevice(cb) {
    const buffer = Buffer.from([0, 0, 0, 0]);

    this.executeCmd(Commands.DISABLE_DEVICE, buffer, cb);
  }
};
