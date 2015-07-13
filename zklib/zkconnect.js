var dgram = require('dgram');

module.exports = function(ZKLib) {
  ZKLib.prototype.connect = function(cb) {

    var self = this;

    if(self.zkclient == null) {
      self.zkclient = dgram.createSocket('udp4');
      self.zkclient.bind(self.inport, function() {
        self.executeCmd( self.CMD_CONNECT, '', function( err, ret ) {
          if(cb)
            cb(null, self.checkValid(self.data_recv));
        });
      });
    }else{
      return cb('socket must be closed first to execute this action');
    }

  };

  ZKLib.prototype.destroy = function(cb) {
    
    var self = this;

    self.zkclient.removeAllListeners();
    self.zkclient.close();
    self.zkclient = null;
    if(cb)
      cb(null, self.checkValid(self.data_recv));
  };

  ZKLib.prototype.disconnect = function(cb,force) {

    var self = this;

    if(force){
      return self.destroy(cb);
    }

    self.executeCmd( self.CMD_EXIT, '', function( err, ret ) {
      return self.destroy(cb);
    });

  };
}
