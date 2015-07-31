var dgram = require('dgram');

module.exports = function(ZKLib) {

  ZKLib.prototype.gettime = function(cb) {
    var self = this;

    return this._executeCmd( this.CMD_GET_TIME, '', function(err,ret) {
      if(err || !ret || ret.length <= 8)
        return cb(err);

      return cb(null, self.decode_time(ret.readUInt32LE(8)));
    });
  };

  ZKLib.prototype.settime = function(t,cb) {
    var self = this;

    var command_string = new Buffer(4);
    command_string.writeUInt32LE(self.encode_time(t), 0);

    return this._executeCmd( this.CMD_SET_TIME, command_string, function(err,ret) {
      if(err || !ret || ret.length <= 8)
        return cb(err);

      return cb(!self.checkValid(ret), ret);
    });
  };

}
