const dgram = require('dgram');

module.exports = class {

  decodeAttLog(buf) {
    const ret = {
      userid: parseInt(buf.slice(8, 11).toString('ascii')),
      timestamp: new Date(2000 + buf[34], buf[35] - 1, buf[36], buf[37], buf[38], buf[39]).getTime()
    };

    return ret;
  }

  startMon(opts) {
    this.connect((err) => {
      //console.log(this.ip + ":" + this.port + " s:" + ret.toString("hex"));

      this.socket = dgram.createSocket('udp4');
      this.socket.bind(this.inport);

      this.socket.on('message', (ret) => {
        //console.log(this.ip + ":" + this.port + " s:" + ret.toString("hex"));

        this.session_id = ret.readUInt16LE(4);
        this.reply_id = ret.readUInt16LE(6);

        if (opts.onatt && ret.length == 40) {
          opts.onatt(null, this.decodeAttLog(ret));
        }
      });

      const buf = new Buffer(12);

      buf.writeUInt16LE(this.Commands.REG_EVENT, 0);
      buf.writeUInt16LE(0, 2);
      buf.writeUInt16LE(this.session_id, 4);
      buf.writeUInt16LE(this.reply_id, 6);
      buf.writeUInt32LE(0x0000ffff, 8);

      const chksum = this.createChkSum(buf);
      buf.writeUInt16LE(chksum, 2);
      this.reply_id = (this.reply_id + 1) % this.USHRT_MAX;
      buf.writeUInt16LE(this.reply_id, 6);

      this.socket.send(buf, 0, buf.length, this.port, this.ip, (err) => {
        if (err) {
          return console.log(err);
        }

        if (opts.start) {
          opts.start(null, 'monitoring started on device ' + this.ip + ':' + this.port);
        }
      });
    });
  }

  stopMon(cb) {
    this.disconnect(cb);
  }
};
