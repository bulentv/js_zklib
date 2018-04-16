var dgram = require('dgram');

module.exports = function(ZKLib) {
  ZKLib.prototype.getSizeAttendance = function() {
    var self = this;

    var command = self.data_recv.readUInt16LE(0);
    if (command == self.CMD_PREPARE_DATA) {
      var size = self.data_recv.readUInt32LE(8);
      return size;
    } else {
      return false;
    }
  };

  ZKLib.prototype.decodeAttendanceData = function(attdata) {
    var self = this;
    var att = {
      uid:
        parseInt(
          attdata
            .slice(0, 4)
            .toString('ascii')
            .split('\0')
            .shift()
        ) || 0,
      id:
        parseInt(
          attdata
            .slice(4, 8)
            .toString('ascii')
            .split('\0')
            .shift()
        ) || 0,
      state: attdata[28],
      timestamp: self.decode_time(attdata.readUInt32LE(29))
    };
    return att;
  };

  ZKLib.prototype.getattendance = function(cb) {
    var self = this;

    var command = self.CMD_ATTLOG_RRQ;
    var command_string = new Buffer([]);
    var chksum = 0;
    var session_id = self.session_id;
    var reply_id = self.data_recv.readUInt16LE(6);

    var buf = self.createHeader(command, chksum, session_id, reply_id, command_string);

    self.socket = dgram.createSocket('udp4');
    self.socket.bind(self.inport);

    var state = self.STATE_FIRST_PACKET;
    var total_bytes = 0;
    var bytes_recv = 0;

    var rem = [];
    var offset = 0;

    var attdata_size = 40;
    var trim_first = 10;
    var trim_others = 8;

    var atts = [];

    self.socket.on('message', function(reply, remote) {
      switch (state) {
        case self.STATE_FIRST_PACKET:
          state = self.STATE_PACKET;

          self.data_recv = reply;

          if (reply && reply.length) {
            self.session_id = reply.readUInt16LE(4);

            total_bytes = self.getSizeAttendance();
            if (total_bytes <= 0) {
              self.socket.removeAllListeners('message');
              self.socket.close();
              self.socket = null;
              cb('zero');
            }
          } else {
            cb('zero length reply');
          }

          break;

        case self.STATE_PACKET:
          if (bytes_recv == 0) {
            offset = trim_first;
            bytes_recv = 4;
          } else {
            offset = trim_others;
          }

          while (reply.length + rem.length - offset >= attdata_size) {
            var attdata = new Buffer(attdata_size);

            if (rem.length > 0) {
              rem.copy(attdata);
              reply.copy(attdata, rem.length, offset);
              offset += attdata_size - rem.length;
              rem = [];
            } else {
              reply.copy(attdata, 0, offset);
              offset += attdata_size;
            }

            var att = self.decodeAttendanceData(attdata);
            atts.push(att);

            bytes_recv += attdata_size;
            if (bytes_recv == total_bytes) {
              state = self.STATE_FINISHED;
            }
          }

          rem = new Buffer(reply.length - offset);
          reply.copy(rem, 0, offset);

          break;

        case self.STATE_FINISHED:
          self.socket.removeAllListeners('message');
          self.socket.close();
          cb(null, atts);
          break;
      }
    });

    self.socket.send(buf, 0, buf.length, self.port, self.ip);
  };
};
