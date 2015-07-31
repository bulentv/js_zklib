var dgram = require('dgram');

module.exports = function(ZKLib) {
  ZKLib.prototype.getSizeUser = function() {
    var self = this;

    var command = self.data_recv.readUInt16LE(0);
    if ( command == self.CMD_PREPARE_DATA ) {
      var size = self.data_recv.readUInt32LE(8);
      return size;
    } else {
      return false;
    }
  };


  ZKLib.prototype.decodeUserData = function(userdata) {
    var user = {
      uid: userdata.readUInt16BE(0),
      role: userdata.readUInt16BE(2),
      password: userdata.slice(4,12).toString("ascii").split('\0').shift(),
      name: userdata.slice(12,36).toString("ascii").split('\0').shift(),
      cardno: userdata.readUInt32LE(36),
      userid: userdata.slice(49,72).toString("ascii").split('\0').shift()
    };
    return user;
  };



  ZKLib.prototype.deluser = function(id,cb) {
    var self = this;

    var command = self.CMD_DELETE_USER;
    var command_string = new Buffer(2);
    command_string.writeUInt16LE(id,0);
    var chksum = 0;
    var session_id = self.session_id;

    var reply_id = self.data_recv.readUInt16LE(6);

    var buf = self.createHeader(command, chksum, session_id, reply_id, command_string);
    
    self.socket = dgram.createSocket('udp4');
    self.socket.bind(self.inport);

    self.socket.once('message', function(reply, remote) {
      self.socket.close();
      
      self.data_recv = reply;

      if(reply && reply.length) {
        self.session_id = reply.readUInt16LE(4);
        cb(!self.checkValid(reply), reply);//self.decode_time(reply.readUInt32LE(8)));
      }else{
        cb("zero length reply");
      }
    });

    self.socket.send(buf, 0, buf.length, self.port, self.ip);


  };
  
/*

c:
5050827d50000000
08004eb9d4b01700
91000000 <-- command string starts here
2c1c05
b4
2c1c05
5445535420555345522034303200 <-- TEST USER 402
75e3feffffffb6af0777 ???
15cd5b07 <--- card no
010000000000000000
343032000000000000000000000000000000000000000000 <-- 402
c:PP.}P.N9T0.,.4,.TEST USER 402.uc~.6/.w.M[.402.


c:
5050827d50000000
0800acb576b31700
9100<-uid
00<-role
002c1c05b42c1c05<-password
544553542055534553203430320075e3feffffffb6af077715cd5b07 < TEST USES 402 (28 byte)
010000000000000000
343032000000000000000000000000000000000000000000
c:PP.}P.,5v3.,.4,.TEST USES 402.uc~.6/.w.M[.402.





*/





/*
  ZK.prototype.setuser = function(uid,userid,name,password,role, cb) {
    //    function zksetuser($self, $uid, $userid, $name, $password, $role) {
      var command = CMD_SET_USER;
      var command_string = new Buffer(72);//str_pad(chr( $uid ), 2, chr(0)).chr($role).str_pad($password, 8, chr(0)).str_pad($name, 28, chr(0)).str_pad(chr(1), 9, chr(0)).str_pad($userid, 8, chr(0)).str_repeat(chr(0),16);
      command_string.writeUInt16LE(uid,0);
      command_string[2] = role;
      command_string.write(password,3,11);
      command_string.write(name,11,39);
      command_string[39] = 1;
      command_string.writeUInt32LE(0,40);
      //command_string.write(uid.toString(10),48) ....
      
      $chksum = 0;
      $session_id = $self->session_id;

      $u = unpack('H2h1/H2h2/H2h3/H2h4/H2h5/H2h6/H2h7/H2h8', substr( $self->data_recv, 0, 8) );
      $reply_id = hexdec( $u['h8'].$u['h7'] );

      $buf = $self->createHeader($command, $chksum, $session_id, $reply_id, $command_string);

      socket_sendto($self->zkclient, $buf, strlen($buf), 0, $self->ip, $self->port);

      try {
        socket_recvfrom($self->zkclient, $self->data_recv, 1024, 0, $self->ip, $self->port);

        $u = unpack('H2h1/H2h2/H2h3/H2h4/H2h5/H2h6', substr( $self->data_recv, 0, 8 ) );

        $self->session_id =  hexdec( $u['h6'].$u['h5'] );
        return substr( $self->data_recv, 8 );
      } catch(ErrorException $e) {
        return FALSE;
      } catch(exception $e) {
        return False;
      }
  }







i*/












  ZKLib.prototype.getuser = function(cb) {
    var self = this;

    var command = self.CMD_USERTEMP_RRQ;
    var command_string = new Buffer([0x05]);
    var chksum = 0;
    var session_id = self.session_id;
    var reply_id = self.data_recv.readUInt16LE(6);

    var buf = self.createHeader(command, chksum, session_id, reply_id, command_string);

    self.socket = dgram.createSocket('udp4');
    self.socket.bind(self.inport);


    
    var state = self.STATE_FIRST_PACKET;
    var total_bytes = 0;
    var bytes_recv = 0;

    var rem = null;
    var offset = 0;

    var userdata_size = 72;
    var trim_first = 11;
    var trim_others = 8;


    var users = [];

    self.socket.on('message', function(reply, remote) {
      switch(state) {
        
        case self.STATE_FIRST_PACKET:
        
          state = self.STATE_PACKET;

          self.data_recv = reply;

          if(reply && reply.length) {
            self.session_id = reply.readUInt16LE(4);

            total_bytes = self.getSizeUser();
            if( total_bytes <= 0 ) {
              self.socket.removeAllListeners('message');
              self.socket.close();
              return cb("no data");
            }

          }else{
            cb("zero length reply");
          }

          break;

        case self.STATE_PACKET:


          if(bytes_recv == 0) {
            offset = trim_first;
            bytes_recv = 4;
          }else{
            offset = trim_others;
          }

          while(reply.length-offset >= userdata_size) {
            var userdata = new Buffer(userdata_size);
            if(rem && rem.length > 0) {
              rem.copy(userdata);
              reply.copy(userdata,rem.length,offset);
              offset += userdata_size - rem.length;
              rem = null;
            }else{
              reply.copy(userdata,0,offset);
              offset += userdata_size;
            }

            var user = self.decodeUserData(userdata);
            users.push(user);
            
            bytes_recv += userdata_size;
            if(bytes_recv == total_bytes) {
              state = self.STATE_FINISHED;
            }

          }

          rem = new Buffer(reply.length - offset);
          reply.copy(rem,0,offset);

          break;

        case self.STATE_FINISHED:
          self.socket.removeAllListeners('message');
          self.socket.close();
          cb(null,users);
          break;

      }
    });

    self.socket.send(buf, 0, buf.length, self.port, self.ip);
  }

};
