# node-zklib #

Attendance Machine Library for NodeJS with a connection to the network using the UDP protocol and port 4370

Install with:

    npm install zklib

## Usage

```js
    var ZKLib = require("zklib");
    ZK = new ZKLib("192.168.5.11", 4370);
    
    // connect to access control device
    ZK.connect( function() {
    
      // read the time info from th device
      ZK.getTime( function(t) {
        console.log("Device clock's time is " + t.toString());
        
        // disconnec from the device
        ZK.disconnect();
      });
    });
```

## How to Contribute
- open a pull request

## Credits
Based on php_zklib (https://github.com/dnaextrim/php_zklib)
