var dgram = require('dgram');

module.exports = function(ZKLib) {

  ZKLib.prototype.connect = function(cb) {
    return this._executeCmd( this.CMD_CONNECT, '', cb );
  };

  ZKLib.prototype.disconnect = function(cb) {
    return this._executeCmd( this.CMD_EXIT, '', cb );
  };

}
