const { Commands, USHRT_MAX } = require('./constants');

exports.defaultTo = (value, defaultValue) => {
  return value !== undefined ? value : defaultValue;
}

/**
 * 
 * @param {number} command 
 * @param {number} session_id 
 * @param {number} reply_id 
 * @param {string | Buffer} data 
 */
exports.createHeader = (command,  session_id, reply_id, data) => {
  const dataBuffer = Buffer.from(data);
  const buf = new Buffer(8 + dataBuffer.length);

  buf.writeUInt16LE(command, 0);
  buf.writeUInt16LE(0, 2);
  buf.writeUInt16LE(session_id, 4);
  buf.writeUInt16LE(reply_id, 6);

  dataBuffer.copy(buf, 8);

  const chksum2 = createChkSum(buf);
  buf.writeUInt16LE(chksum2, 2);

  reply_id = (reply_id + 1) % USHRT_MAX;
  buf.writeUInt16LE(reply_id, 6);

  return buf;
}

const createChkSum = (p) => {
  let chksum = 0;

  for (let i = 0; i < p.length; i += 2) {
    if (i == p.length - 1) {
      chksum += p[i];
    } else {
      chksum += p.readUInt16LE(i);
    }
    chksum %= USHRT_MAX;
  }

  chksum = USHRT_MAX - chksum - 1;

  return chksum;
}

exports.createChkSum = createChkSum

exports.checkValid = (reply)=> {
  const command = reply.readUInt16LE(0);
  return command == Commands.ACK_OK;
}
