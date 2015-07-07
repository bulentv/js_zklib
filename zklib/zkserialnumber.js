module.exports = function(ZKLib) {
  ZKLib.prototype.serialNumber = function(cb) {

    var self = this;

    self.executeCmd( self.CMD_DEVICE, '~SerialNumber', function( err, ret ) {
      cb(null, self.data_recv.slice(8).toString())
    });

  };

  ZKLib.prototype.version = function(cb) {

    var self = this;

    self.executeCmd( self.CMD_DEVICE, '~ZKFPVersion', function( err, ret ) {
      cb(null, self.data_recv.slice(8).toString())
    });

  };
}
