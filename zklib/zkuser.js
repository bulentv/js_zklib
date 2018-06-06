const dgram = require('dgram');

const {Commands, States} = require('./constants');
const {createHeader, checkValid} = require('./utils');

module.exports = class {
  getSizeUser() {
    const command = this.data_recv.readUInt16LE(0);

    if (command == Commands.PREPARE_DATA) {
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
    const command = Commands.DELETE_USER;
    const command_string = new Buffer(2);

    command_string.writeUInt16LE(id, 0);

    const session_id = this.session_id;
    const reply_id = this.data_recv.readUInt16LE(6);
    const buf = createHeader(command, session_id, reply_id, command_string);

    this.socket = dgram.createSocket('udp4');
    this.socket.bind(this.inport);

    this.socket.once('message', (reply, remote) => {
      this.closeSocket();

      this.data_recv = reply;

      if (reply && reply.length) {
        this.session_id = reply.readUInt16LE(4);
        cb(checkValid(reply) ? null : 'Invalid request', reply);
      } else {
        cb('zero length reply');
      }
    });

    this.socket.send(buf, 0, buf.length, this.port, this.ip);
  }

  setUser(uid, password = '', name = '', user_id = '', cb) {
    const command = Commands.USER_WRQ;
    const command_string = new Buffer(72);

    command_string.writeUInt16LE(uid, 0);
    command_string[2] = 0;
    command_string.write(password, 3, 11);
    command_string.write(name, 11, 39);
    command_string[39] = 1;
    command_string.writeUInt32LE(0, 40);
    command_string.write(user_id.toString(10), 48);

    const session_id = this.session_id;
    const reply_id = this.data_recv.readUInt16LE(6);

    const buf = createHeader(command, session_id, reply_id, command_string);

    this.socket = dgram.createSocket('udp4');
    this.socket.bind(this.inport);

    this.socket.once('message', (reply, remote) => {
      this.closeSocket();

      this.data_recv = reply;

      if (reply && reply.length) {
        this.session_id = reply.readUInt16LE(4);
        cb(checkValid(reply) ? null : 'Invalid request', reply);
      } else {
        cb('Zero Length Reply');
      }
    });

    this.socket.send(buf, 0, buf.length, this.port, this.ip);
  }

  enrollUser(id, cb) {
    const command = Commands.START_ENROLL;
    const command_string = new Buffer(2);

    command_string.write(id);

    const session_id = this.session_id;
    const reply_id = this.data_recv.readUInt16LE(6);
    const buf = createHeader(command, session_id, reply_id, command_string);

    this.socket = dgram.createSocket('udp4');
    this.socket.bind(this.inport);

    this.socket.once('message', (reply, remote) => {
      this.closeSocket();

      this.data_recv = reply;

      if (reply && reply.length) {
        this.session_id = reply.readUInt16LE(4);
        cb(checkValid(reply) ? null : 'Invalid request', reply);
      } else {
        cb('zero length reply');
      }
    });

    this.socket.send(buf, 0, buf.length, this.port, this.ip);
  }

  /**
   *
   * @param {(err: Error, users: object[]) => void} cb
   */
  getUser(cb) {
    const command = Commands.USERTEMP_RRQ;
    const command_string = Buffer.from([0x05]);

    const session_id = this.session_id;
    const reply_id = this.data_recv.readUInt16LE(6);

    const buf = createHeader(command, session_id, reply_id, command_string);

    this.socket = dgram.createSocket('udp4');
    this.socket.bind(this.inport);

    let state = States.FIRST_PACKET;
    let total_bytes = 0;
    let bytes_recv = 0;
    let rem = Buffer.from([]);
    let offset = 0;

    const userdata_size = 72;
    const trim_first = 11;
    const trim_others = 8;
    const users = [];

    this.socket.on('message', (reply, remote) => {
      switch (state) {
        case States.FIRST_PACKET:
          state = States.PACKET;

          this.data_recv = reply;

          if (reply && reply.length) {
            this.session_id = reply.readUInt16LE(4);

            total_bytes = this.getSizeUser();

            if (total_bytes <= 0) {
              this.closeSocket();

              return cb(new Error('no data'));
            }
          } else {
            cb(new Error('zero length reply'));
          }

          break;

        case States.PACKET:
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
              rem = Buffer.from([]);
            } else {
              reply.copy(userdata, 0, offset);
              offset += userdata_size;
            }

            const user = this.decodeUserData(userdata);
            users.push(user);

            bytes_recv += userdata_size;

            if (bytes_recv == total_bytes) {
              state = States.FINISHED;
            }
          }

          rem = new Buffer(reply.length - offset);
          reply.copy(rem, 0, offset);

          break;

        case States.FINISHED:
          this.closeSocket();

          cb(null, users);

          break;
      }
    });

    this.socket.send(buf, 0, buf.length, this.port, this.ip);
  }

  // Deprecation warnings
  getuser(cb) {
    console.warn('getuser() function will deprecated soon, please use getUser()');
    return this.getUser(cb);
  }

  enrolluser(id, cb) {
    console.warn('enrolluser() function will deprecated soon, please use enrollUser()');
    return this.enrollUser(id, cb);
  }

  setuser(uid, password = '', name = '', user_id = '', cb) {
    console.warn('setuser() function will deprecated soon, please use setUser()');
    return this.setUser(uid, password, name, user_id, cb);
  }

  deluser(id, cb) {
    console.warn('deluser() function will deprecated soon, please use delUser()');
    return this.delUser(id, cb);
  }
};
