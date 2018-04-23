# node-zklib

Attendance Machine Library for NodeJS with a connection to the network using the UDP protocol and port 4370

Install with:

    npm install zklib

## Usage

```js
const ZKLib = require('zklib');

ZK = new ZKLib({
  ip: '192.168.5.11',
  port: 4370,
  inport: 5200,
  timeout: 5000
});

// connect to access control device
ZK.connect(function(err) {
  if (err) throw err;

  // read the time info from th device
  ZK.getTime(function(err, t) {
    // disconnect from the device
    ZK.disconnect();

    if (err) throw err;

    console.log("Device clock's time is " + t.toString());
  });
});
```

## Configuration

| Option           | Required | Values                | Default  |
| ---------------- | -------- | --------------------- | -------- |
| ip               | yes      | string                |          |
| port             | -        | number                | 4370     |
| inport           | yes      | number                |          |
| timeout          | -        | number                | -        |
| attendanceParser | -        | [ 'legacy', 'v6.60' ] | 'legacy' |

## API

* connect(callback) -> To Connect in machine.
* disconnect() -> Disconnect connection with machine.
* serialNumber(callback) -> Get serial number machine.
* version(callback) -> Get version of machine.
* getAttendance(callback) -> Get attendance data.
* clearAttendanceLog(callback) -> Clear the attendance logs from device.
* getTime(callback) -> Get time of machine.
* setTime(value, callback) -> Set time in machine.
* getUser(callback) -> Get all user in machine.

## Handle Callback

```js
ZK.getTime(function(err, time) {
  if (err) throw err;
  console.log("Device clock's time is " + time.toString());
});
```

## Testing

```js
yarn test
```

## Contributors

* Bulent Vural https://github.com/bulentv
* Matias Ribichich https://github.com/mribichich
* Shodiqul Muzaki https://github.com/creativefull
* shubhamoy https://github.com/shubhamoy

## How to Contribute

* Open a pull request

## Notes about versions

* v0.1.x - Supported nodejs version: >= 0.10.48
* v0.2.x - Supported nodejs version: >= 7.5.0

## Credits

Based on php_zklib (https://github.com/dnaextrim/php_zklib)
