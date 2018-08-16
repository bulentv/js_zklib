const {Commands, USHRT_MAX} = require('./constants');

exports.defaultTo = (value, defaultValue) => {
  return value !== undefined ? value : defaultValue;
};

/**
 *
 * @param {number} command
 * @param {number} session_id
 * @param {number} reply_id
 * @param {string | Uint8Array | Buffer} data
 * @param {string | Uint8Array | Buffer} [prefix]
 * @returns {Buffer}
 */
exports.createHeader = (command, session_id, reply_id, data, prefix) => {
  const dataBuffer = Buffer.from(data);
  const buf = Buffer.alloc(8 + dataBuffer.length);

  buf.writeUInt16LE(command, 0);
  buf.writeUInt16LE(0, 2);
  buf.writeUInt16LE(session_id, 4);
  buf.writeUInt16LE(reply_id, 6);

  dataBuffer.copy(buf, 8);

  const chksum2 = createChkSum(buf);
  buf.writeUInt16LE(chksum2, 2);

  reply_id = (reply_id + 1) % USHRT_MAX;
  buf.writeUInt16LE(reply_id, 6);

  if (!prefix || prefix === 'udp') {
    return buf;
  }

  if (prefix === 'tcp') {
    const prefixBuf = Buffer.from([0x50, 0x50, 0x82, 0x7d, 0x08, 0x00, 0x00, 0x00]);

    return Buffer.concat([prefixBuf, buf]);
  }

  const prefixBuf = Buffer.from(prefix);

  return Buffer.concat([prefixBuf, buf]);
};

/**
 *
 * @param {Buffer} buf
 * @returns {number}
 */
function createChkSum(buf) {
  let chksum = 0;

  for (let i = 0; i < buf.length; i += 2) {
    if (i == buf.length - 1) {
      chksum += buf[i];
    } else {
      chksum += buf.readUInt16LE(i);
    }

    chksum %= USHRT_MAX;
  }

  chksum = USHRT_MAX - chksum - 1;

  return chksum;
}

exports.createChkSum = createChkSum;

/**
 *
 * @param {Buffer} buf
 * @returns {boolean}
 */
exports.checkValid = buf => {
  const command = buf.readUInt16LE(0);

  // ACK_OK_2 (2005) is used in another firmware 6.60 from 2017
  return command == Commands.ACK_OK || command == Commands.ACK_OK_2;
};

/**
 *
 * @param {Buffer} buf
 * @returns {Buffer}
 */
exports.removeTcpHeader = buf => {
  if (buf.length < 8) {
    return buf;
  }

  if (buf.compare(Buffer.from([0x50, 0x50, 0x82, 0x7d]), 0, 4, 0, 4) !== 0) {
    return buf;
  }

  return buf.slice(8);
};

/**
 *
 * @param {string} hexString
 * @returns {Buffer}
 */
exports.hexStringToBuffer = hexString => {
  const buf = [];

  for (let i = 0; i < hexString.length; i += 2) {
    buf.push(parseInt(hexString.substr(i, 2), 16));
  }

  return Buffer.from(buf);
};
