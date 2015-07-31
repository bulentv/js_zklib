var dgram = require("dgram");

function ZKLib(options) {
  var self = this;
  self._initConsts();
  self.ip = options.ip;
  self.port = options.port;
  self.inport = options.inport;


  self.socket = null;

  self.reply_id = -1 + self.USHRT_MAX;

  self.data_recv = '';
  self.session_id = 0;
}

ZKLib.prototype._executeCmd = function(command, command_string,cb) {
  var self = this;

  if( command == self.CMD_CONNECT ) {
    self.reply_id = -1 + self.USHRT_MAX;
  }

  var buf = self.createHeader(command, 0, self.session_id, self.reply_id, command_string);

  self.socket = dgram.createSocket('udp4');
  self.socket.bind(self.inport);

  self.socket.once('message', function(reply, remote) {
    self.socket.close();

    self.data_recv = reply;

    if(reply && reply.length) {
      self.session_id = reply.readUInt16LE(4);
      self.reply_id = reply.readUInt16LE(6);
      cb(!self.checkValid(reply), reply);
    }else{
      cb("zero length reply");
    }
  });

  self.socket.send(buf, 0, buf.length, self.port, self.ip);

};

ZKLib.prototype.createHeader = function(command, chksum, session_id, reply_id, command_string) {

  var self = this;

  var buf_command_string = new Buffer(command_string);
  var buf = new Buffer( 8 + buf_command_string.length );

  buf.writeUInt16LE(command, 0);
  buf.writeUInt16LE(chksum, 2);
  buf.writeUInt16LE(session_id, 4);
  buf.writeUInt16LE(reply_id, 6);

  buf_command_string.copy(buf, 8);

  var chksum = self.createChkSum(buf);
  buf.writeUInt16LE(chksum, 2);

  reply_id = (reply_id + 1) % self.USHRT_MAX;
  buf.writeUInt16LE(reply_id, 6);

  return buf;

};


ZKLib.prototype.createChkSum = function(p) {
  var self = this;

  var chksum = 0;

  for(var i=0; i<p.length; i+=2) {
    if(i==p.length-1) {
      chksum += p[i];
    }else{
      chksum += p.readUInt16LE(i);
    }
    chksum %= self.USHRT_MAX;
  }

  chksum = self.USHRT_MAX - chksum - 1;

  return chksum;

};

ZKLib.prototype._initConsts = function() {
  var self = this;
  self.USHRT_MAX = 65535;
  self.CMD_CONNECT = 1000;
  self.CMD_EXIT = 1001;
  self.CMD_ENABLEDEVICE = 1002;
  self.CMD_DISABLEDEVICE = 1003;
  self.CMD_ACK_OK = 2000;
  self.CMD_ACK_ERROR = 2001;
  self.CMD_ACK_DATA = 2002;
  self.CMD_PREPARE_DATA = 1500;
  self.CMD_DATA = 1501;
  self.CMD_USERTEMP_RRQ = 9;
  self.CMD_ATTLOG_RRQ = 13;
  self.CMD_CLEAR_DATA = 14;
  self.CMD_CLEAR_ATTLOG = 15;
  self.CMD_DELETE_USER = 18;
  self.CMD_WRITE_LCD = 66;
  self.CMD_GET_TIME = 201;
  self.CMD_SET_TIME = 202;
  self.CMD_VERSION = 1100;
  self.CMD_DEVICE = 11;
  self.CMD_CLEAR_ADMIN = 20;
  self.CMD_SET_USER = 8;
  self.LEVEL_USER = 0;
  self.LEVEL_ADMIN = 14;

  self.STATE_FIRST_PACKET = 1;
  self.STATE_PACKET = 2;
  self.STATE_FINISHED = 3;
};

ZKLib.prototype.checkValid = function(reply) {
  var self = this;

  var command = reply.readUInt16LE(0);

  return (command == self.CMD_ACK_OK);
};

ZKLib.prototype.encode_time = function(t) {
  var d = ( (t.getFullYear() % 100) * 12 * 31 + ((t.getMonth()) * 31) + t.getDate() - 1) *
  (24 * 60 * 60) + (t.getHours() * 60 + t.getMinutes()) * 60 + t.getSeconds();

  return d;
};

ZKLib.prototype.decode_time = function(t) {
  var second = t % 60;
  t = (t-second) / 60;

  var minute = t % 60;
  t = (t-minute) / 60;

  var hour = t % 24;
  t = (t-hour) / 24;

  var day = t % 31+1;
  t = (t-(day-1)) / 31;

  var month = t % 12;
  t = (t-month) / 12;

  var year = t + 2000;

  var d = new Date( year, month, day, hour, minute, second );

  return d;
}

module.exports = ZKLib;

require('./zkconnect')(ZKLib);
require('./zkserial')(ZKLib);
require('./zkversion')(ZKLib);
require('./zktime')(ZKLib);
require('./zkattendance')(ZKLib);
require('./zkuser')(ZKLib);
require('./zkmon')(ZKLib);
  
