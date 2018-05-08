const dgram = require('dgram');

module.exports = class {
  getSizeUser() {
    const command = this.data_recv.readUInt16LE(0);

    if (command == this.Commands.PREPARE_DATA) {
      const size = this.data_recv.readUInt32LE(8);
      return size;
    } else {
      return 0;
    }
  }

  decodeUserData(userdata) {
    const user = {
      uid: userdata.readUInt16BE(0),
      role: userdata.readUInt16BE(2),
      password: userdata
        .slice(4, 12)
        .toString('ascii')
        .split('\0')
        .shift(),
      name: userdata
        .slice(12, 36)
        .toString('ascii')
        .split('\0')
        .shift(),
      cardno: userdata.readUInt32LE(36),
      userid: userdata
        .slice(49, 72)
        .toString('ascii')
        .split('\0')
        .shift()
    };

    return user;
  }

  delUser(id, cb) {
    const command = this.Commands.DELETE_USER;
    const command_string = new Buffer(2);

    command_string.writeUInt16LE(id, 0);

    let chksum = 0;

    const session_id = this.session_id;
    const reply_id = this.data_recv.readUInt16LE(6);
    const buf = this.createHeader(command, chksum, session_id, reply_id, command_string);

    this.socket = dgram.createSocket('udp4');
    this.socket.bind(this.inport);

    this.socket.once('message', (reply, remote) => {
      this.socket.close();

      this.data_recv = reply;

      if (reply && reply.length) {
        this.session_id = reply.readUInt16LE(4);
        cb(this.checkValid(reply)? null : 'Invalid request', reply);
      } else {
        cb('zero length reply');
      }
    });

    this.socket.send(buf, 0, buf.length, this.port, this.ip);
  }

  setUser(uid, password = '', name = '', user_id = '', cb) {
    const command = this.Commands.USER_WRQ;
    const command_string = new Buffer(72);

    command_string.writeUInt16LE(uid, 0);
    command_string[2] = 0;
    command_string.write(password, 3, 11);
    command_string.write(name, 11, 39);
    command_string[39] = 1;
    command_string.writeUInt32LE(0, 40);
    command_string.write(user_id.toString(10), 48);

    let chksum = 0;
    const session_id = this.session_id;
    const reply_id = this.data_recv.readUInt16LE(6);

    const buf = this.createHeader(command, chksum, session_id, reply_id, command_string);

    this.socket = dgram.createSocket('udp4');
    this.socket.bind(this.inport);

    this.socket.once('message', (reply, remote) => {
      this.socket.close();
      this.data_recv = reply;

      if (reply && reply.length) {
        this.session_id = reply.readUInt16LE(4);
        cb(this.checkValid(reply)? null : 'Invalid request', reply);
      } else {
        cb('Zero Length Reply');
      }
    });

    this.socket.send(buf, 0, buf.length, this.port, this.ip);
  }

  enrollUser(id, cb) {
    const command = this.Commands.START_ENROLL;
    const command_string = new Buffer(2);

    command_string.write(id);

    let chksum = 0;
    const session_id = this.session_id;
    const reply_id = this.data_recv.readUInt16LE(6);
    const buf = this.createHeader(command, chksum, session_id, reply_id, command_string);

    this.socket = dgram.createSocket('udp4');
    this.socket.bind(this.inport);

    this.socket.once('message', (reply, remote) => {
      this.socket.close();
      this.data_recv = reply;

      if (reply && reply.length) {
        this.session_id = reply.readUInt16LE(4);
        cb(this.checkValid(reply)? null : 'Invalid request', reply);
      } else {
        cb('zero length reply');
      }
    });

    this.socket.send(buf, 0, buf.length, this.port, this.ip);
  }

  getUser(cb) {
    const command = this.Commands.USERTEMP_RRQ;
    const command_string = new Buffer([0x05]);

    let chksum = 0;

    const session_id = this.session_id;
    const reply_id = this.data_recv.readUInt16LE(6);

    const buf = this.createHeader(command, chksum, session_id, reply_id, command_string);

    this.socket = dgram.createSocket('udp4');
    this.socket.bind(this.inport);

    let state = this.States.FIRST_PACKET;
    let total_bytes = 0;
    let bytes_recv = 0;
    let rem = new Buffer([]);
    let offset = 0;

    const userdata_size = 72;
    const trim_first = 11;
    const trim_others = 8;
    const users = [];

    this.socket.on('message', (reply, remote) => {
      switch (state) {
        case this.States.FIRST_PACKET:
          state = this.States.PACKET;

          this.data_recv = reply;

          if (reply && reply.length) {
            this.session_id = reply.readUInt16LE(4);

            total_bytes = this.getSizeUser();

            if (total_bytes <= 0) {
              this.socket.removeAllListeners('message');
              this.socket.close();

              return cb('no data');
            }
          } else {
            cb('zero length reply');
          }

          break;

        case this.States.PACKET:
          if (bytes_recv == 0) {
            offset = trim_first;
            bytes_recv = 4;
          } else {
            offset = trim_others;
          }

          while (reply.length + rem.length - offset >= userdata_size) {
            const userdata = new Buffer(userdata_size);

            if (rem.length > 0) {
              rem.copy(userdata);
              reply.copy(userdata, rem.length, offset);
              offset += userdata_size - rem.length;
              rem = new Buffer([]);
            } else {
              reply.copy(userdata, 0, offset);
              offset += userdata_size;
            }

            const user = this.decodeUserData(userdata);
            users.push(user);

            bytes_recv += userdata_size;

            if (bytes_recv == total_bytes) {
              state = this.States.FINISHED;
            }
          }

          rem = new Buffer(reply.length - offset);
          reply.copy(rem, 0, offset);

          break;

        case this.States.FINISHED:
          this.socket.removeAllListeners('message');
          this.socket.close();

          cb(null, users);

          break;
      }
    });

    this.socket.send(buf, 0, buf.length, this.port, this.ip);
  }

  // Deprecation warnings
  getuser(cb) {
    console.error('getuser() function will deprecated soon, please use getUser()');
    return this.getUser(cb);
  }

  enrolluser(id, cb) {
    console.error('enrolluser() function will deprecated soon, please use enrollUser()');
    return this.enrollUser(id, cb);
  }

  setuser(uid, password = '', name = '', user_id = '', cb) {
    console.error('setuser() function will deprecated soon, please use setUser()');
    return this.setUser(uid, password, name, user_id, cb);
  }

  deluser(id, cb) {
    console.error('deluser() function will deprecated soon, please use delUser()');
    return this.delUser(id, cb);
  }
};
