module.exports = function(ZKLib) {

  ZKLib.prototype.zkmonclient = null;

  ZKLib.prototype.monenabled = false;

  ZKLib.prototype.decodeAttLog = function(buf) {

    var ret = {
      userid: parseInt(buf.slice(8,11).toString("ascii")),
      timestamp: (new Date( 2000 + buf[34], buf[35] - 1, buf[36], buf[37], buf[38], buf[39] )).getTime()
    };

    return ret;

  };

  ZKLib.prototype.startMon = function(opts) {



    var self = this;

    var mon_session_id;
    
    var mon_reply_id = -1 + self.USHRT_MAX;

    
    self.zkmonclient.once('message', function(ret) {
      
      //console.log(self.ip+":"+self.port+" s:"+ret.toString("hex"));

      mon_session_id = ret.readUInt16LE(4);
      mon_reply_id = ret.readUInt16LE(6);

      self.zkmonclient.on('message', function(ret) {

        //console.log(self.ip+":"+self.port+" s:"+ret.toString("hex"));

        mon_session_id = ret.readUInt16LE(4);
        mon_reply_id = ret.readUInt16LE(6);

        if(opts.onatt && ret.length == 40)
          opts.onatt( null, self.decodeAttLog(ret));
      });
      
      var buf = new Buffer(12);
      buf.writeUInt16LE(self.CMD_REG_EVENT,0);
      buf.writeUInt16LE(0,2);
      buf.writeUInt16LE(mon_session_id,4);
      buf.writeUInt16LE(mon_reply_id,6);
      buf.writeUInt32LE(0x0000ffff,8);

      var chksum = self.createChkSum(buf);
      buf.writeUInt16LE(chksum,2);
      mon_reply_id = (mon_reply_id+1) % self.USHRT_MAX;
      buf.writeUInt16LE(mon_reply_id,6);

      self.zkmonclient.send(buf, 0, buf.length, self.port, self.ip, function(err) {

        if(err) {
          self.monenabled = false;
          return console.log(err);
        }

        self.monenabled = true;
        //console.log(self.ip+":"+self.port+" c:"+buf.toString("hex"));

        if(opts.start)
          opts.start(null,'monitoring started on device '+self.ip+":"+self.port);


      });
    });
    
    self.zkmonclient.on('close', function(buf) {
      self.monenabled = false;
    });

    self.zkmonclient.on('error', function(buf) {
      self.monenabled = false;
    });

    var buf = new Buffer(8);
    buf.writeUInt16LE(self.CMD_CONNECT,0);
    buf.writeUInt16LE(0,2);
    buf.writeUInt16LE(mon_session_id,4);
    buf.writeUInt16LE(mon_reply_id,6);

    var chksum = self.createChkSum(buf);
    buf.writeUInt16LE(chksum,2);
    mon_reply_id = (mon_reply_id+1) % self.USHRT_MAX;
    buf.writeUInt16LE(mon_reply_id,6);

    self.zkmonclient.send(buf, 0, buf.length, self.port, self.ip, function(err) {

      if(err) {
        self.monenabled = false;
        return console.log(err);
      }
      //console.log(self.ip+":"+self.port+" c:"+buf.toString("hex"));

    });
  };


  ZKLib.prototype.stopMon = function(cb) {

    var self = this;
  
    self.zkmonclient.close();

  };

}
