const dgram = require('dgram');

const mixin = require('./mixin');
const attParserLegacy = require('./att_parser_legacy');
const attParserV660 = require('./att_parser_v6.60');
const {defaultTo, createHeader, checkValid} = require('./utils');
const {Commands, USHRT_MAX} = require('./constants');

/**
  @typedef Options
  @type {object}
  @property {string} ip - Zk device ipAddress
  @property {number} [port] - Zk device port
  @property {number} inport - Socket port to bind to
  @property {number} [timeout] - Zk device port
  @property {string} [attendanceParser] - Zk device port
 */

/**
  @property {string} ip - Zk device ipAddress
  @property {number} [port] - Zk device port
  @property {number} inport - Socket port to bind to
  @property {number} [timeout] - Zk device port
  @property {string} [attendanceParser] - Zk device port
  @property {('message' | 'data')} DATA_EVENT
  @property {dgram.Socket} socket
 */
class ZKLib {
  /**
   * @param  {Options} options
   */
  constructor(options) {
    this.validateOptions(options);

    this.ip = options.ip;
    this.port = defaultTo(options.port, 4370);
    this.inport = options.inport;
    this.timeout = options.timeout;
    this.attendanceParser = defaultTo(options.attendanceParser, attParserLegacy.name);

    this.DATA_EVENT = 'message';

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

  /**
   *
   * @param {number} command
   * @param {string | Uint8Array | Buffer} data
   * @param {*} cb
   */
  executeCmd(command, data, cb) {
    if (command == Commands.CONNECT) {
      this.reply_id = -1 + USHRT_MAX;
    }

    const buf = createHeader(command, this.session_id, this.reply_id, data);

    // this.createSocket();

    const handleOnData = (reply, remote) => {
      // this.closeSocket();

      // this.socket.removeListener(this.DATA_EVENT, handleOnData);

      this.data_recv = reply;

      if (reply && reply.length && reply.length >= 8) {
        this.session_id = reply.readUInt16LE(4);
        this.reply_id = reply.readUInt16LE(6);

        cb && cb(checkValid(reply) ? null : new Error('Invalid request'), reply);
      } else {
        cb && cb(new Error('Invalid length reply'));
      }
    };

    this.socket.once(this.DATA_EVENT, handleOnData);

    this.send(buf, 0, buf.length, err => {
      if (err) {
        cb && cb(err);
        return;
      }
    });
  }

  /**
   *
   * @param {(error: Error) => void} [cb]
   */
  createSocket(cb) {
    this.socket = this.createUdpSocket(this.inport, cb);
  }

  /**
   *
   * @param {number} port
   * @param {(error: Error) => void} [cb]
   */
  createUdpSocket(port, cb) {
    const socket = dgram.createSocket('udp4');

    socket.once('error', err => {
      socket.close();

      cb(err);
    });

    socket.on('listening', () => {
      cb();
    });

    socket.bind(port);

    return socket;
  }

  /**
   *
   * @param {String | Uint8Array | Buffer} msg
   * @param {number} offset
   * @param {number} length
   * @param {(error: Error) => void} [cb]
   */
  send(msg, offset, length, cb) {
    this.writeUdpSocket(this.socket, msg, offset, length, cb);
  }

  /**
   *
   * @param {dgram.Socket} socket
   * @param {String | Uint8Array | Buffer} msg
   * @param {number} offset
   * @param {number} length
   * @param {(error: Error) => void} [cb]
   */
  writeUdpSocket(socket, msg, offset, length, cb) {
    const handleOnData = () => {
      this.sendTimeoutId && clearTimeout(this.sendTimeoutId);

      cb();
    };

    socket.once(this.DATA_EVENT, handleOnData);

    socket.send(msg, offset, length, this.port, this.ip, err => {
      if (err) {
        cb && cb(err);
        return;
      }

      if (this.timeout) {
        this.sendTimeoutId = setTimeout(() => {
          // this.closeSocket();

          cb && cb(new Error('Timeout error'));
        }, this.timeout);
      }
    });
  }

  closeSocket() {
    this.closeUdpSocket(this.socket);
  }

  /**
   *
   * @param {dgram.Socket} socket
   */
  closeUdpSocket(socket) {
    socket.removeAllListeners('message');
    socket.close();
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
