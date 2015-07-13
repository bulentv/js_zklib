var dgram = require("dgram");

function ZKLib(opts) {

  var self = this;

  this.ip = opts.ip;
  this.port = opts.port;
  this.inport = opts.inport;
  this.zkclient = null;


  this.data_recv = new Buffer([0,0,0,0,0,0,0,0]);
  this.session_id = 0;

}

module.exports = ZKLib;

require('./zkconst')(ZKLib);
require('./zkconnect')(ZKLib);
require('./zkserialnumber')(ZKLib);
require('./zkattendance')(ZKLib);
require('./zkuser')(ZKLib);
require('./zktime')(ZKLib);
require('./zkmon')(ZKLib);

ZKLib.prototype.createChkSum = function(p) {

  var self = this;

  var i=0, chksum=0, l=p.length;
  while(l-i>1) {
    var u = p.readUInt16LE(i);
    chksum += u;
    i+=2;
    if(l-i==1)
      chksum += p[l-1];
  }
  chksum = self.USHRT_MAX - (chksum % self.USHRT_MAX) - 1;
  return chksum;
};

ZKLib.prototype.createHeaderMon = function(command, session_id, reply_id) {

  var self = this;

  var buf = new Buffer(12);//(command_string.length || 0));
  buf.writeUInt16LE(command,0);
  buf.writeUInt16LE(0,2);
  buf.writeUInt16LE(session_id,4);
  buf.writeUInt16LE(reply_id,6);
  buf.writeUInt32LE(0x0000ffff,8);


  var chksum = self.createChkSum(buf);
  buf.writeUInt16LE(chksum,2);
  reply_id = (reply_id+1) % self.USHRT_MAX;
  buf.writeUInt16LE(reply_id,6);

  return buf;

};


ZKLib.prototype.createHeader = function(command, session_id, reply_id, command_string) {

  var self = this;

  var buf = new Buffer(8 + (command_string.length || 0));
  buf.writeUInt16LE(command,0);
  buf.writeUInt16LE(0,2);
  buf.writeUInt16LE(session_id,4);
  buf.writeUInt16LE(reply_id,6);

  if(command_string && command_string.length)
    buf.write(command_string,8,command_string.length);

  var chksum = self.createChkSum(buf);
  buf.writeUInt16LE(chksum,2);
  reply_id = (reply_id+1) % self.USHRT_MAX;
  buf.writeUInt16LE(reply_id,6);

  return buf;

};


ZKLib.prototype.checkValid = function(returnreply) {

  var self = this;

  var command = returnreply.readUInt16LE(0);
  if (command == self.CMD_ACK_OK)
    return true;
  else
    return false;
};

ZKLib.prototype.handleReply = function(message, remote, cb) {
  
  var self = this;

  self.data_recv = message;
  self.session_id = self.data_recv.readUInt16LE(4);
  self.reply_id = self.data_recv.readUInt16LE(6);

  if(cb)
    cb(null, self.data_recv);

  //console.log("s:"+message.toString("hex"));
};

ZKLib.prototype.executeCmd = function( command, command_string, cb ) {
  
  var self = this;

  if( command == self.CMD_CONNECT ) {
    self.reply_id = -1 + self.USHRT_MAX;
  }

  self.zkclient.once("message", function(message, remote) {
    console.log(remote.address+":"+remote.port+" "+message.toString("hex"));
    self.handleReply(message, remote,cb);
  });
  
  var buf = self.createHeader(command, self.session_id, self.reply_id, command_string);

  self.zkclient.send(buf, 0, buf.length, self.port, self.ip, function(err) {
    if(err)
      console.log(err);
  });

};


ZKLib.prototype.checkValid = function(returnreply) {

  var self = this;

  var command = returnreply.readUInt16LE(0);
  if (command == self.CMD_ACK_OK)
    return true;
  else
    return false;
};

ZKLib.prototype.cleanString = function(buf) {
  var str = "";
  for(var i=0; i<buf.length; i++) {
    if(buf[i] == 0) break;
    str += String.fromCharCode(buf[i]);
  }
  return str;
};

