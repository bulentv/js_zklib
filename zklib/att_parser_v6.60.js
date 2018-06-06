const timeParser = require('./timestamp_parser');

module.exports.name = 'v6.60';

const uidIndex = 4;
const uidLength = 9;

/**
  @typedef Attendance
  @type {object}
  @property {number} id - The ID of the Attendance
  @property {number} uid - The ID of the user
  @property {number} state - Equals to the VerificationType (for compatibility)
  @property {Date} timestamp - The dateTime of the Attendance
  @property {number} verificationType - Fingerprint Only (1), Face Only (15), or any other method
  @property {number} inOutStatus - Check-In (0), Check-Out (1)
 /

/**
 * 
 * @param {Buffer} attdata 
 * @returns {Attendance} Returns an Attendance
 */
module.exports.parse = attdata => ({
  id: (attdata[3] << 8) + attdata[2],
  uid: parseInt(attdata.slice(uidIndex, uidIndex + uidLength).toString('ascii')),
  state: attdata[28],
  timestamp: timeParser.decode(attdata.readUInt32LE(29)),
  verificationType: attdata[28],
  inOutStatus: attdata[33],
});