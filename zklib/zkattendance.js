const dgram = require('dgram');

const attParserLegacy = require('./att_parser_legacy');
const attParserV660 = require('./att_parser_v6.60');
const {Commands, States} = require('./constants');
const {createHeader} = require('./utils');

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

  /**
   *
   * @param {(error: Error, data) => void} [cb]
   */
  getAttendance(cb) {
    const session_id = this.session_id;
    const reply_id = this.data_recv.readUInt16LE(6);

    const buf = createHeader(Commands.ATTLOG_RRQ, session_id, reply_id, '');

    let state = States.FIRST_PACKET;
    let total_bytes = 0;
    let bytes_recv = 0;

    let rem = Buffer.from([]);
    let offset = 0;

    const attdata_size = 40;
    const trim_first = 10;
    const trim_others = 8;

    const atts = [];

    const internalCallback = (err, data) => {
      this.socket.removeListener(this.DATA_EVENT, handleOnData);

      cb(err, data);
    };

    const handleOnData = (reply, remote) => {
      switch (state) {
        case States.FIRST_PACKET:
          state = States.PACKET;
          this.data_recv = reply;

          if (reply && reply.length) {
            this.session_id = reply.readUInt16LE(4);
            total_bytes = this.getSizeAttendance();

            if (total_bytes <= 0) {
              internalCallback(new Error('zero'));
            }
          } else {
            internalCallback(new Error('zero length reply'));
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
              rem = Buffer.from([]);
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
          internalCallback(null, atts);
          break;
      }
    };

    this.socket.on(this.DATA_EVENT, handleOnData);

    this.send(buf, 0, buf.length, err => {
      if (err) {
        internalCallback && internalCallback(err);
      }
    });
  }

  /**
   *
   * @param {(error: Error) => void} [cb]
   */
  clearAttendanceLog(cb) {
    return this.executeCmd(Commands.CLEAR_ATTLOG, '', (err, ret) => {
      if (err) return cb(err);

      return cb(null);
    });
  }

  /**
   *
   * @param {(error: Error) => void} [cb]
   * @deprecated since version 0.2.0. Use getAttendance instead
   */
  getattendance(cb) {
    console.warn('getattendance() function will deprecated soon, please use getAttendance()');
    return this.getAttendance(cb);
  }
};
