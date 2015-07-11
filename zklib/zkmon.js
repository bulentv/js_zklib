var dgram = require('dgram');

module.exports = function(ZKLib) {

  ZKLib.prototype.zkclient = null;

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
    
    self.connect( function(err) {
      
      //console.log(self.ip+":"+self.port+" s:"+ret.toString("hex"));

      self.zkclient.on('message', function(ret) {

        //console.log(self.ip+":"+self.port+" s:"+ret.toString("hex"));

        self.session_id = ret.readUInt16LE(4);
        self.reply_id = ret.readUInt16LE(6);

        if(opts.onatt && ret.length == 40)
          opts.onatt( null, self.decodeAttLog(ret));
      });
      
      var buf = new Buffer(12);
      buf.writeUInt16LE(self.CMD_REG_EVENT,0);
      buf.writeUInt16LE(0,2);
      buf.writeUInt16LE(self.session_id,4);
      buf.writeUInt16LE(self.reply_id,6);
      buf.writeUInt32LE(0x0000ffff,8);

      var chksum = self.createChkSum(buf);
      buf.writeUInt16LE(chksum,2);
      self.reply_id = (self.reply_id+1) % self.USHRT_MAX;
      buf.writeUInt16LE(self.reply_id,6);

      self.zkclient.send(buf, 0, buf.length, self.port, self.ip, function(err) {

        if(err) {
          return console.log(err);
        }

        if(opts.start)
          opts.start(null,'monitoring started on device '+self.ip+":"+self.port);

      });
    });
    
  };


  ZKLib.prototype.stopMon = function(cb) {

    var self = this;
  
    self.disconnect( cb );

  };

}
