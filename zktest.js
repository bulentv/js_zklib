const ZKLib = require('./zklib/zklib');
const async = require('async');

const ip = '192.168.1.201';
const port = 4370;
const inport = 5200;

const zk = new ZKLib({ ip, port, inport });

async.series(
  [
    next => {
      zk.connect((err, ret) => {
        next(err, ret);
      });
    },
    (next, err, ret) => {
      zk.serialNumber((err, ret) => {
        console.log(err, ret);
        next(err, ret);
      });
    },
    (next, err, ret) => {
      zk.version((err, ret) => {
        console.log(err, ret);
        next(err, ret);
      });
    },
    (next, err, ret) => {
      zk.gettime((err, ret) => {
        console.log(err, ret);
        next(err, ret);
      });
    },
    (next, err, ret) => {
      zk.getattendance((err, ret) => {
        console.log(err, ret);
        next();
      });
    },
    (next, err, ret) => {
      zk.getuser((err, ret) => {
        console.log(err, ret);
        next(err, ret);
      });
    },
    (next, err, ret) => {
      zk.enrolluser('56', (err, ret) => {
        console.log(err, ret);
        next();
      });
    },
    (next, err, ret) => {
      zk.setuser(56, '', 'Leh Sun', '56', (err, ret) => {
        console.log(err, ret);
        next();
      });
    }
  ],
  err => {
    console.log('done!');
  }
);
