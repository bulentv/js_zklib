const dgram = require('dgram');

const {createChkSum} = require('./utils');
const {Commands, USHRT_MAX} = require('./constants');

module.exports = class {
  decodeAttLog(buf) {
    const ret = {
      userid: parseInt(buf.slice(8, 11).toString('ascii')),
      timestamp: new Date(2000 + buf[34], buf[35] - 1, buf[36], buf[37], buf[38], buf[39]).getTime(),
    };

    return ret;
  }

  /**
   * Untested
   * @param {*} opts    *
   */
  startMon(opts) {
    // this.connect(err => {

    //   this.createSocket();

    this.socket.on('message', ret => {
      if (opts.onatt && ret.length == 40) {
        opts.onatt(null, this.decodeAttLog(ret));
      }
    });

    const buf = new Buffer(12);

    buf.writeUInt16LE(Commands.REG_EVENT, 0);
    buf.writeUInt16LE(0, 2);
    buf.writeUInt16LE(this.session_id, 4);
    buf.writeUInt16LE(this.reply_id, 6);
    buf.writeUInt32LE(0x0000ffff, 8);

    // const chksum = createChkSum(buf);
    // buf.writeUInt16LE(chksum, 2);
    // this.reply_id = (this.reply_id + 1) % USHRT_MAX;
    // buf.writeUInt16LE(this.reply_id, 6);

    // this.socket.send(buf, 0, buf.length, this.port, this.ip, err => {
    //   if (err) {
    //     return console.log(err);
    //   }

    //   if (opts.start) {
    //     opts.start(null, 'monitoring started on device ' + this.ip + ':' + this.port);
    //   }
    // });

    this.send(buf, 0, buf.length, err => {
      if (err) {
        opts.start(err);
        return;
      }

      if (opts.start) {
        opts.start();
      }
    });
    // });
  }

  // stopMon(cb) {
  //   this.disconnect(cb);
  // }
};
