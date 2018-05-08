const dgram = require('dgram');

const attParserLegacy = require('./att_parser_legacy');
const attParserV660 = require('./att_parser_v6.60');
const { Commands, States } = require('./constants');

module.exports = class {
  getSizeAttendance() {
    const command = this.data_recv.readUInt16LE(0);

    if (command == Commands.PREPARE_DATA) {
      return this.data_recv.readUInt32LE(8);
    } else {
      return 0;
    }
  }

  decodeAttendanceData(attdata) {
    switch (this.attendanceParser) {
      case attParserV660.name:
        return attParserV660.parse(attdata);

      case attParserLegacy.name:
      default:
        return attParserLegacy.parse(attdata);
    }
  }

  getAttendance(cb) {
    const command = Commands.ATTLOG_RRQ;
    const command_string = new Buffer([]);
    let chksum = 0;
    const session_id = this.session_id;
    const reply_id = this.data_recv.readUInt16LE(6);

    const buf = this.createHeader(command, chksum, session_id, reply_id, command_string);

    this.socket = dgram.createSocket('udp4');
    this.socket.bind(this.inport);

    let state = States.FIRST_PACKET;
    let total_bytes = 0;
    let bytes_recv = 0;

    let rem = new Buffer([]);
    let offset = 0;

    const attdata_size = 40;
    const trim_first = 10;
    const trim_others = 8;

    const atts = [];

    this.socket.on('message', (reply, remote) => {
      switch (state) {
        case States.FIRST_PACKET:
          state = States.PACKET;
          this.data_recv = reply;

          if (reply && reply.length) {
            this.session_id = reply.readUInt16LE(4);
            total_bytes = this.getSizeAttendance();

            if (total_bytes <= 0) {
              this.socket.removeAllListeners('message');
              this.socket.close();
              this.socket = null;
              cb('zero');
            }
          } else {
            cb('zero length reply');
          }

          break;

        case States.PACKET:
          if (bytes_recv == 0) {
            offset = trim_first;
            bytes_recv = 4;
          } else {
            offset = trim_others;
          }

          while (reply.length + rem.length - offset >= attdata_size) {
            const attdata = new Buffer(attdata_size);
            if (rem.length > 0) {
              rem.copy(attdata);
              reply.copy(attdata, rem.length, offset);
              offset += attdata_size - rem.length;
              rem = new Buffer([]);
            } else {
              reply.copy(attdata, 0, offset);
              offset += attdata_size;
            }

            const att = this.decodeAttendanceData(attdata);
            atts.push(att);

            bytes_recv += attdata_size;
            if (bytes_recv == total_bytes) {
              state = States.FINISHED;
            }
          }

          rem = new Buffer(reply.length - offset);
          reply.copy(rem, 0, offset);

          break;

        case States.FINISHED:
          this.socket.removeAllListeners('message');
          this.socket.close();
          cb(null, atts);
          break;
      }
    });

    this.send(buf, 0, buf.length, err => {
      if (err) {
        cb && cb(err);
      }
    });
  }

  clearAttendanceLog(cb) {
    return this.executeCmd(Commands.CLEAR_ATTLOG, '', (err, ret) => {
      if (err || !ret || ret.length < 8) return cb(err);

      return cb(null);
    });
  }

  // Deprecation warnings
  getattendance(cb) {
    console.warn('getattendance() function will deprecated soon, please use getAttendance()');
    return this.getAttendance(cb);
  }
};
