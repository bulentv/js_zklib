# node-zklib #

Attendance Machine Library for NodeJS with a connection to the network using the UDP protocol and port 4370

Install with:

    npm install zklib

## Usage

```js
    var ZKLib = require("zklib");
    ZK = new ZKLib({
      ip : "192.168.5.11", 
      port : 4370,
      inport : 5200
    });
    
    // connect to access control device
    ZK.connect( function() {
    
      // read the time info from th device
      ZK.getTime( function(err, t) {
        console.log("Device clock's time is " + t.toString());
        
        // disconnect from the device
        ZK.disconnect();
      });
    });
```

## API
- connect(callback) -> To Connect in machine.
- disconnect() -> Disconnect connection with machine.
- serialNumber(callback) -> Get serial number machine.
- version(callback) -> Get version of machine.
- getattendance(callback) -> Get attendance data.
- gettime(callback) -> Get time of machine.
- settime(value, callback) -> Set time in machine.
- getuser(callback) -> Get all user in machine.

## Handle Callback

```js
Zk.getTime(function(err, time) {
  if (err) throw err;
  console.log("Device clock's time is " + time.toString());
})
```

## Contributor
- Bulent Vural https://github.com/bulentv
- Shodiqul Muzaki https://github.com/creativefull

## How to Contribute
- open a pull request

## Credits
Based on php_zklib (https://github.com/dnaextrim/php_zklib)
