module.exports = function(ZKLib) {
  ZKLib.prototype.getSizeAttendance = function(buf) {
    
    var self = this;

    var command = buf.readUInt16LE(0);

    if ( command == self.CMD_PREPARE_DATA )
      return buf.readUInt32LE(8);
    else
      return false;
  }

  ZKLib.prototype.getAttendance = function(opts) {

    var self = this;
    var leftover = new Buffer(0), attsize = 0, bytes=0, first=true;

    var str = "";

    var onAttChunk = function(ret) {

      var n = self.getSizeAttendance(ret);

      if(n) {
        attsize = n;
        return self.zkclient.once( "message", onAttChunk );
      }
      
      var offs = first?10:8;

      var newlosize = ( leftover.length + ( ret.length - offs ) ) % 40;
      var buf = new Buffer( leftover.length + (ret.length - newlosize - offs )  );
      leftover.copy( buf );
      ret.copy( buf, leftover.length, offs, ret.length - newlosize);

      leftover = new Buffer( newlosize );
      ret.copy( leftover, 0, ret.length - newlosize, ret.length );


      for(var i=0; i<buf.length; i+=40) {

        var entry = buf.slice(i,i+39);

        var att = {
          uid: entry.readUInt32BE(0)>>8,
          id: parseInt(entry.slice(3,7).toString("ascii").replace(/\u0000/g,'')),
          state: entry[28],
          timestamp: self.decode_time( entry.readUInt32LE(29) )
        };

        if(opts.onatt)
          opts.onatt(null, att);


      }

      first = false;
      bytes += ret.length;
      
      if(bytes < attsize) {
        self.zkclient.once( "message", onAttChunk );
      }else{
        self.zkclient.once( "message", function(message, remote) {
          self.handleReply(message, remote)
        });
        
        setTimeout( function() {
        if(opts.onend)
          opts.onend();
        },1000);
      }

      

    };

    self.zkclient.once( "message", onAttChunk );

    var buf = new Buffer(8);
    buf.writeUInt16LE( self.CMD_ATTLOG_RRQ,0);
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

  ZKLib.prototype.clearAttendance = function(cb) {

    var self = this;

    self.executeCmd( CMD_CLEAR_ATTLOG, "", function(err, ret) {
      cb(null, self.data_recv.slice(8).toString())
    });

  };
  
};
