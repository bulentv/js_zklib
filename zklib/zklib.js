const dgram = require('dgram');
const mixin = require('./mixin');

class ZKLib{

  constructor(options) {
    this._initConsts();
    this.ip = options.ip;
    this.port = options.port;
    this.inport = options.inport;
    this.timeout = options.timeout;

    this.socket = null;

    this.reply_id = -1 + this.USHRT_MAX;

    this.data_recv = '';
    this.session_id = 0;
  }

  executeCmd(command, command_string, cb) {
    if (command == this.Commands.CONNECT) {
      this.reply_id = -1 + this.USHRT_MAX;
    }

    const buf = this.createHeader(command, 0, this.session_id, this.reply_id, command_string);

    this.socket = dgram.createSocket('udp4');
    this.socket.bind(this.inport);

    let timeout;

    this.socket.once('message', (reply, remote) => {
      this.socket.close();

      timeout && clearTimeout(timeout);

      this.data_recv = reply;

      if (reply && reply.length) {
        this.session_id = reply.readUInt16LE(4);
        this.reply_id = reply.readUInt16LE(6);
        cb && cb(!this.checkValid(reply), reply);
      } else {
        cb && cb('zero length reply');
      }
    });

    this.socket.send(buf, 0, buf.length, this.port, this.ip, err => {
      if (err) {
        cb && cb(err);
        return;
      }

      if (this.timeout) {
        timeout = setTimeout(() => {
          this.socket.close();

          cb && cb(new Error('Timeout error'));
        }, this.timeout);
      }
    });
  }

  createHeader(command, chksum, session_id, reply_id, command_string) {
    const buf_command_string = new Buffer(command_string);
    const buf = new Buffer(8 + buf_command_string.length);

    buf.writeUInt16LE(command, 0);
    buf.writeUInt16LE(chksum, 2);
    buf.writeUInt16LE(session_id, 4);
    buf.writeUInt16LE(reply_id, 6);

    buf_command_string.copy(buf, 8);

    const chksum2 = this.createChkSum(buf);
    buf.writeUInt16LE(chksum2, 2);

    reply_id = (reply_id + 1) % this.USHRT_MAX;
    buf.writeUInt16LE(reply_id, 6);

    return buf;
  }

  createChkSum(p) {
    let chksum = 0;

    for (let i = 0; i < p.length; i += 2) {
      if (i == p.length - 1) {
        chksum += p[i];
      } else {
        chksum += p.readUInt16LE(i);
      }
      chksum %= this.USHRT_MAX;
    }

    chksum = this.USHRT_MAX - chksum - 1;

    return chksum;
  }

  initConsts() {
    this.USHRT_MAX = 65535;

    this.Commands = {
      CONNECT: 1000,
      EXIT: 1001,
      ENABLEDEVICE: 1002,
      DISABLEDEVICE: 1003,
      ACK_OK: 2000,
      ACK_ERROR: 2001,
      ACK_DATA: 2002,
      PREPARE_DATA: 1500,
      DATA: 1501,
      USER_WRQ: 8,
      USERTEMP_RRQ: 9,
      ATTLOG_RRQ: 13,
      CLEAR_DATA: 14,
      CLEAR_ATTLOG: 15,
      DELETE_USER: 18,
      WRITE_LCD: 66,
      GET_TIME: 201,
      SET_TIME: 202,
      VERSION: 1100,
      DEVICE: 11,
      CLEAR_ADMIN: 20,
      START_ENROLL: 61//,
      //SET_USER: 8
    };

    this.Levels = {
      USER: 0,
      ADMIN: 14
    };

    this.States =  {
      FIRST_PACKET: 1,
      PACKET: 2,
      FINISHED: 3
    };
  }

  checkValid(reply) {
    const command = reply.readUInt16LE(0);
    return command == this.Commands.ACK_OK;
  }

  encode_time(t) {
    const d =
    ((t.getFullYear() % 100) * 12 * 31 + t.getMonth() * 31 + t.getDate() - 1) * (24 * 60 * 60) +
      (t.getHours() * 60 + t.getMinutes()) * 60 +
      t.getSeconds();

    return d;
  }

  decode_time(t) {
    const second = t % 60;
    t = (t - second) / 60;

    const minute = t % 60;
    t = (t - minute) / 60;

    const hour = t % 24;
    t = (t - hour) / 24;

    const day = t % 31 + 1;
    t = (t - (day - 1)) / 31;

    const month = t % 12;
    t = (t - month) / 12;

    const year = t + 2000;

    const d = new Date(year, month, day, hour, minute, second);

    return d;
  }
}

const moduleNames = [
  'connect',
  'serial',
  'version',
  'time',
  'attendance',
  'user',
  'mon'
];

const modules = {};

for (let i = 0; i < moduleNames.length; i++) {
  const moduleName = moduleNames[i];
  const moduleImpl = require(`./zk${moduleName}`);
  mixin(ZKLib, moduleImpl);
}

module.exports = ZKLib;
