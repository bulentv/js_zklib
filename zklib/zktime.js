module.exports = function(ZKLib) {
  ZKLib.prototype.setTime = function(t,cb) {

    var self = this;

    self.zkclient.once('message', function(ret) {
      cb(null);
    });
    
    var tn = self.encode_time(t);

    var buf = new Buffer(12);
    buf.writeUInt16LE(self.CMD_SET_TIME,0);
    buf.writeUInt16LE(0,2);
    buf.writeUInt16LE(self.session_id,4);
    buf.writeUInt16LE(self.reply_id,6);
    buf.writeUInt32LE(tn,8);

    var chksum = self.createChkSum(buf);
    buf.writeUInt16LE(chksum,2);
    self.reply_id = (self.reply_id+1) % self.USHRT_MAX;
    buf.writeUInt16LE(self.reply_id,6);

    self.zkclient.send(buf, 0, buf.length, self.port, self.ip, function(err) {
    });



  };

  ZKLib.prototype.getTime = function(cb) {

    var self = this;

    self.zkclient.once('message', function(ret) {
      try{
        var tn = ret.readUInt32LE(8);
        var t = self.decode_time(tn);
        cb(null,t);
      }catch(e) {
        cb(e);
      }
    });

    var buf = new Buffer(8);
    buf.writeUInt16LE(self.CMD_GET_TIME,0);
    buf.writeUInt16LE(0,2);
    buf.writeUInt16LE(self.session_id,4);
    buf.writeUInt16LE(self.reply_id,6);

    var chksum = self.createChkSum(buf);
    buf.writeUInt16LE(chksum,2);
    self.reply_id = (self.reply_id+1) % self.USHRT_MAX;
    buf.writeUInt16LE(self.reply_id,6);

    self.zkclient.send(buf, 0, buf.length, self.port, self.ip, function(err) {
    });
  };
}
