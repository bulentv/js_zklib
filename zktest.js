var ZKLib = require('./zklib/zklib');


var zk = new ZKLib("10.22.150.51",4370);

zk.connect( function() {
  zk.getTime( function(err,t) {
    console.log(t);
    zk.disconnect( function() {

    });
    /*
    var t = new Date();
    zk.setTime( t,function() {
      zk.getTime( function() {
      });
    });
    */
  });
  /*
  zk.getUser( {
    onuser:function(err,user) {
      if(err)
        return console.log("error:",err);

      console.log(user);
    },
    onend:function() {
      zk.getAttendance( {
        onatt:function(err,att) {
          if(err)
            return console.log("error:",err);

          console.log(att);
        },
        onend: function() {
          zk.disconnect();
          console.log("finished");
        }
      });
    }
  });
  */
});


