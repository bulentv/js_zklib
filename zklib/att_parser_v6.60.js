const timeParser = require('./timestamp_parser');

module.exports.name = 'v6.60';

module.exports.parse = attdata => ({
  id: (attdata[3] << 8) + attdata[2],
  uid: parseInt(attdata.slice(4, 6).toString('ascii')),
  state: attdata[28],
  timestamp: timeParser(attdata.readUInt32LE(29))
});
