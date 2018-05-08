const dgram = require('dgram');

const mixin = require('./mixin');
const attParserLegacy = require('./att_parser_legacy');
const attParserV660 = require('./att_parser_v6.60');
const { defaultTo } = require('./utils');
const { Commands } = require('./constants');

class ZKLib {
  /**
   * @param  { {ip:string, port?:number, inport:number, timeout?:number, attendanceParser?: string }} options
   */
  constructor(options) {
    this.initConsts();

    this.validateOptions(options);

    this.ip = options.ip;
    this.port = defaultTo(options.port, 4370);
    this.inport = options.inport;
    this.timeout = options.timeout;
    this.attendanceParser = defaultTo(options.attendanceParser, attParserLegacy.name);

    this.socket = null;

    this.reply_id = -1 + this.USHRT_MAX;

    this.data_recv = '';
    this.session_id = 0;
  }

  validateOptions(options) {
    if (!options) {
      throw new Error('Options required');
    }

    if (!options.ip) {
      throw new Error('IP option required');
    }

    if (!options.inport) {
      throw new Error('Inport option required');
    }

    if (options.attendanceParser && ![attParserLegacy.name, attParserV660.name].includes(options.attendanceParser)) {
      throw new Error('Attendance parser option unknown');
    }
  }

  executeCmd(command, command_string, cb) {
    if (command == Commands.CONNECT) {
      this.reply_id = -1 + this.USHRT_MAX;
    }

    const buf = this.createHeader(command, 0, this.session_id, this.reply_id, command_string);

    this.socket = dgram.createSocket('udp4');
    this.socket.bind(this.inport);

    this.socket.once('message', (reply, remote) => {
      this.socket.close();

      this.data_recv = reply;

      if (reply && reply.length) {
        this.session_id = reply.readUInt16LE(4);
        this.reply_id = reply.readUInt16LE(6);
        cb && cb(this.checkValid(reply) ? null : 'Invalid request', reply);
      } else {
        cb && cb('Zero length reply');
      }
    });

    this.send(buf, 0, buf.length, err => {
      if (err) {
        cb && cb(err);
        return;
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
  }

  checkValid(reply) {
    const command = reply.readUInt16LE(0);
    return command == Commands.ACK_OK;
  }

  /**
   *
   * @param {String | any[] | Buffer} msg
   * @param {number} offset
   * @param {number} length
   * @param {(error: Error | string) => void} [cb]
   */
  send(msg, offset, length, cb) {
    this.socket.once('message', () => {
      this.sendTimeoutId && clearTimeout(this.sendTimeoutId);

      cb();
    });

    this.socket.send(msg, offset, length, this.port, this.ip, err => {
      if (err) {
        cb && cb(err);
        return;
      }

      if (this.timeout) {
        this.sendTimeoutId = setTimeout(() => {
          this.socket.close();

          cb && cb(new Error('Timeout error'));
        }, this.timeout);
      }
    });
  }
}

const moduleNames = ['connect', 'serial', 'version', 'time', 'attendance', 'user', 'mon', 'device'];

const modules = {};

for (let i = 0; i < moduleNames.length; i++) {
  const moduleName = moduleNames[i];
  const moduleImpl = require(`./zk${moduleName}`);
  mixin(ZKLib, moduleImpl);
}

module.exports = ZKLib;
