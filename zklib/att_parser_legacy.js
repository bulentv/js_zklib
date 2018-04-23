const timeParser = require('./timestamp_parser');

module.exports.name = 'legacy';

module.exports.parse = attdata => ({
  uid:
    parseInt(
      attdata
        .slice(0, 4)
        .toString('ascii')
        .split('\0')
        .shift()
    ) || 0,
  id:
    parseInt(
      attdata
        .slice(4, 8)
        .toString('ascii')
        .split('\0')
        .shift()
    ) || 0,
  state: attdata[28],
  timestamp: timeParser.decode(attdata.readUInt32LE(29))
});
