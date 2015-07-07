module.exports = function(ZKLib) {
  ZKLib.prototype.connect = function(cb) {

    var self = this;

    self.executeCmd( self.CMD_CONNECT, '', function( err, ret ) {
      if(cb)
        cb(null, self.checkValid(self.data_recv));
    });


  };

  ZKLib.prototype.disconnect = function(cb) {

    var self = this;

    self.executeCmd( self.CMD_EXIT, '', function( err, ret ) {
      if(cb)
        cb(null, self.checkValid(self.data_recv));
    });

  };
}
