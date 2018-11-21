const attParserLegacy = require('./att_parser_legacy');
const attParserV660 = require('./att_parser_v6.60');
const {Commands, States, ConnectionTypes} = require('./constants');
const {createHeader, removeTcpHeader} = require('./utils');

module.exports = class {
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
    this.reply_id++;

    const buf = createHeader(Commands.ATTLOG_RRQ, this.session_id, this.reply_id, '', this.connectionType);

    const ATTDATA_SIZE = 40;
    const TRIM_FIRST = 10;
    const TRIM_NEXT = this.connectionType === ConnectionTypes.UDP ? 8 : 0;

    let state = States.FIRST_PACKET;
    let total_bytes = 0;
    let attendancesBuffer = Buffer.from([]);

    const internalCallback = (err, data) => {
      this.socket.removeListener(this.DATA_EVENT, handleOnData);

      cb && cb(err, data);
    };

    /**
     *
     * @param {Buffer} reply
     */
    const handleOnData = reply => {
      // console.log(reply.toString('hex'));

      switch (state) {
        case States.FIRST_PACKET:
          state = States.PACKET;

          reply = this.connectionType === ConnectionTypes.UDP ? reply : removeTcpHeader(reply);

          if (reply && reply.length) {
            const cmd = reply.readUInt16LE(0);

            if (cmd == Commands.ACK_ERROR) {
              internalCallback(new Error('ack error'));
              return;
            }

            total_bytes = reply.readUInt32LE(8) - 4;
            total_bytes += 2;

            if (total_bytes <= 0) {
              internalCallback(new Error('zero'));
              return;
            }

            if (reply.length > 16) {
              handleOnData(reply.slice(16));
            }
          } else {
            internalCallback(new Error('zero length reply'));
            return;
          }

          break;

        case States.PACKET:
          if (attendancesBuffer.length == 0) {
            reply = this.connectionType === ConnectionTypes.UDP ? reply : removeTcpHeader(reply);
            reply = reply.slice(TRIM_FIRST);
          } else {
            reply = reply.slice(TRIM_NEXT);
          }

          reply = removeHeadersInMiddle(reply);

          attendancesBuffer = Buffer.concat([attendancesBuffer, reply]);

          // TODO: if sizes are not the same we should throw an error. rigth know if they not match it simple hangs

          if (attendancesBuffer.length === total_bytes) {
            const atts = [];

            for (let i = 0; i < attendancesBuffer.length - 2; i += ATTDATA_SIZE) {
              const att = this.decodeAttendanceData(attendancesBuffer.slice(i, i + ATTDATA_SIZE));
              atts.push(att);
            }

            internalCallback(null, atts);
            return;
          }

          break;
      }
    };

    this.socket.on(this.DATA_EVENT, handleOnData);

    this.send(buf, 0, buf.length, err => {
      if (err) {
        internalCallback(err);
      }
    });
  }

  /**
   *
   * @param {(error?: Error) => void} [cb]
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

function removeHeadersInMiddle(reply) {
  let buf = Buffer.from(reply);

  while (true) {
    const headerIndex = buf.indexOf(Buffer.from([0x50, 0x50, 0x82, 0x7d]));

    if (headerIndex === -1) {
      break;
    }

    buf = Buffer.from([...buf.slice(0, headerIndex), ...buf.slice(headerIndex + 16)]);
  }

  return buf;
}
