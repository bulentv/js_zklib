module.exports = function(ZKLib) {

  ZKLib.prototype.USHRT_MAX=65535;
  ZKLib.prototype.CMD_CONNECT=1000;
  ZKLib.prototype.CMD_EXIT=1001;
  ZKLib.prototype.CMD_ENABLEDEVICE=1002;
  ZKLib.prototype.CMD_DISABLEDEVICE=1003;
  ZKLib.prototype.CMD_ACK_OK=2000;
  ZKLib.prototype.CMD_ACK_ERROR=2001;
  ZKLib.prototype.CMD_ACK_DATA=2002;
  ZKLib.prototype.CMD_PREPARE_DATA=1500;
  ZKLib.prototype.CMD_DATA=1501;
  ZKLib.prototype.CMD_USERTEMP_RRQ=9;
  ZKLib.prototype.CMD_ATTLOG_RRQ=13;
  ZKLib.prototype.CMD_CLEAR_DATA=14;
  ZKLib.prototype.CMD_CLEAR_ATTLOG=15;
  ZKLib.prototype.CMD_WRITE_LCD=66;
  ZKLib.prototype.CMD_GET_TIME=201;
  ZKLib.prototype.CMD_SET_TIME=202;
  ZKLib.prototype.CMD_VERSION=1100;
  ZKLib.prototype.CMD_DEVICE=11;
  ZKLib.prototype.CMD_CLEAR_ADMIN=20;
  ZKLib.prototype.CMD_SET_USER=8;
  ZKLib.prototype.CMD_REG_EVENT=500;
  ZKLib.prototype.LEVEL_USER=0;
  ZKLib.prototype.LEVEL_ADMIN=14;

  ZKLib.prototype.encode_time = function(t) {


    var d = ( (t.getFullYear() % 100) * 12 * 31 + ((t.getMonth()+1 - 1) * 31) + t.getDate() - 1) * (24 * 60 * 60) + (t.getHours() * 60 + t.getMinutes()) * 60 + t.getSeconds();

    console.log(d);
    return d;
  };

  ZKLib.prototype.decode_time = function(t) {

    var second = t % 60;
    t = Math.floor( t / 60);

    var minute = t % 60;
    t = Math.floor( t / 60);

    var hour = t % 24;
    t = Math.floor( t / 24);

    var day = t % 31+1;
    t = Math.floor( t / 31);

    var month = t % 12+1;
    t = Math.floor( t / 12);

    var year = Math.floor( t + 2000 );

    var d = new Date(year, month-1, day, hour, minute, second);

    return d;

  };
}
