const dgram = require('dgram');

const mixin = require('./mixin');
const attParserLegacy = require('./att_parser_legacy');
const attParserV660 = require('./att_parser_v6.60');
const {defaultTo, createHeader, checkValid} = require('./utils');
const {Commands, USHRT_MAX} = require('./constants');

class ZKLib {
  /**
   * @param  { {ip:string, port?:number, inport:number, timeout?:number, attendanceParser?: string }} options
   */
  constructor(options) {
    this.validateOptions(options);

    this.ip = options.ip;
    this.port = defaultTo(options.port, 4370);
    this.inport = options.inport;
    this.timeout = options.timeout;
    this.attendanceParser = defaultTo(options.attendanceParser, attParserLegacy.name);

    this.socket = null;

    this.reply_id = -1 + USHRT_MAX;

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

  executeCmd(command, data, cb) {
    if (command == Commands.CONNECT) {
      this.reply_id = -1 + USHRT_MAX;
    }

    const buf = createHeader(command, this.session_id, this.reply_id, data);

    this.socket = dgram.createSocket('udp4');
    this.socket.bind(this.inport);

    this.socket.once('message', (reply, remote) => {
      this.socket.close();

      this.data_recv = reply;

      if (reply && reply.length) {
        this.session_id = reply.readUInt16LE(4);
        this.reply_id = reply.readUInt16LE(6);
        cb && cb(checkValid(reply) ? null : 'Invalid request', reply);
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
