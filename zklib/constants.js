exports.Commands = Object.freeze({
  CONNECT: 1000,
  EXIT: 1001,
  ENABLE_DEVICE: 1002,
  DISABLE_DEVICE: 1003,
  RESTART: 1004,
  POWEROFF: 1005,
  SLEEP: 1006, // Ensure the machine to be at the idle state
  RESUME: 1007, // Awakens the sleep machine (temporarily not to support)
  CAPTUREFINGER: 1009, // Captures fingerprints picture
  TEST_TEMP: 1011, // Test some fingerprint exist or does not
  CAPTUREIMAGE: 1012, // Capture the entire image
  REFRESHDATA: 1013, // Refresh the machine interior data
  REFRESHOPTION: 1014, // Refresh the configuration parameter
  TESTVOICE: 1017, // Play voice
  VERSION: 1100, // Obtain the firmware edition
  CHANGE_SPEED: 1101, // Change transmission speed
  AUTH: 1102, // Connection authorizations
  ACK_OK: 2000,
  ACK_ERROR: 2001,
  ACK_DATA: 2002,
  ACK_OK_2: 2005,
  PREPARE_DATA: 1500,
  DATA: 1501,
  FREE_DATA: 1502, // Clear machine opened buffer
  USER_WRQ: 8,
  USERTEMP_RRQ: 9,
  ATTLOG_RRQ: 13,
  CLEAR_DATA: 14,
  CLEAR_ATTLOG: 15,
  DELETE_USER: 18,
  WRITE_LCD: 66,
  GET_TIME: 201,
  SET_TIME: 202,
  DEVICE: 11,
  CLEAR_ADMIN: 20,
  START_ENROLL: 61,
  GET_FREE_SIZES: 50,
  TZ_RRQ: 27,
  TZ_WRQ: 28,
  UNLOCK: 31,
  REG_EVENT: 500, // Register the Event
});

exports.Levels = Object.freeze({
  USER: 0,
  ADMIN: 14,
});

exports.States = Object.freeze({
  FIRST_PACKET: 1,
  PACKET: 2,
  FINISHED: 3,
});

exports.USHRT_MAX = 65535;

exports.ConnectionTypes = Object.freeze({
  UDP: 'udp',
  TCP: 'tcp',
});
