module.exports = function(ZKLib) {
  ZKLib.prototype.getSizeUser = function() {
    
    var self = this;

    var command = buf.readUInt16LE(0);

    if ( command == self.CMD_PREPARE_DATA )
      return buf.readUInt32LE(8);
    else
      return false;

  };

  ZKLib.prototype.zksetuser = function (uid, userid, name, password, role) {

    /*
    $command = CMD_SET_USER;
    $command_string = str_pad(chr( $uid ), 2, chr(0)).chr($role).str_pad($password, 8, chr(0)).str_pad($name, 28, chr(0)).str_pad(chr(1), 9, chr(0)).str_pad($userid, 8, chr(0)).str_repeat(chr(0),16);
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
    */

  };

  ZKLib.prototype.getUser = function (opts) {
    
    var self = this;
    var leftover = new Buffer(0), attsize = 0, bytes=0, first=true;

    var str = "";

    var onAttChunk = function(ret) {

      var n = self.getSizeAttendance(ret);

      if(n) {
        attsize = n;
        return self.zkclient.once( "message", onAttChunk );
      }
      
      var offs = first?11:8;

      var newlosize = ( leftover.length + ( ret.length - offs ) ) % 72;
      var buf = new Buffer( leftover.length + (ret.length - newlosize - offs )  );
      leftover.copy( buf );
      ret.copy( buf, leftover.length, offs, ret.length - newlosize);

      leftover = new Buffer( newlosize );
      ret.copy( leftover, 0, ret.length - newlosize, ret.length );


      for(var i=0; i<buf.length; i+=72) {

        var entry = buf.slice(i,i+72);

        var user = {
          uid: entry.readUInt16BE(0),
          role: entry.readUInt16BE(2),
          password: self.cleanString(entry.slice(4,12)),
          name: self.cleanString(entry.slice(12,36)),
          userid: parseInt(self.cleanString(entry.slice(49, 72))),
          cardno: entry.readUInt32LE(36)
        };

        if(opts.onuser)
          opts.onuser(null, user);

      }

      first = false;
      bytes += ret.length;
      
      if(bytes < attsize-100) {
        self.zkclient.once( "message", onAttChunk );
      }else{
        self.zkclient.once( "message", self.handleReply );

        if(opts.onend)
          opts.onend();
      }
    };

    self.zkclient.once( "message", onAttChunk );

    var buf = new Buffer(8);
    buf.writeUInt16LE( self.CMD_USERTEMP_RRQ,0);
    buf.writeUInt16LE(0,2);
    buf.writeUInt16LE(self.session_id,4);
    buf.writeUInt16LE(self.reply_id,6);

    var chksum = self.createChkSum(buf);
    buf.writeUInt16LE(chksum,2);
    self.reply_id = (self.reply_id+1) % self.USHRT_MAX;
    buf.writeUInt16LE(self.reply_id,6);

    self.zkclient.send(buf, 0, buf.length, self.port, self.ip, function(err) {

      if(err) {
        return console.log(err);
      }
    });

  };

  ZKLib.prototype.clearUser = function () {

    /*
    $command = CMD_CLEAR_DATA;
    $command_string = '';
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
    */
  };

  ZKLib.prototype.clearAdmin = function () {
    /*
    $command = CMD_CLEAR_ADMIN;
    $command_string = '';
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
    */
  };
};
