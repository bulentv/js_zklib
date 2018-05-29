const timeParser = require('./timestamp_parser');

module.exports.name = 'v6.60';

const uidIndex = 4;
const uidLength = 9;

module.exports.parse = attdata => ({
  id: (attdata[3] << 8) + attdata[2],
  uid: parseInt(attdata.slice(uidIndex, uidIndex + uidLength).toString('ascii')),
  state: attdata[28],
  timestamp: timeParser.decode(attdata.readUInt32LE(29))
});