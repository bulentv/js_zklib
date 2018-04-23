const ZKLib = require('../zklib/zklib');

describe('options validation', () => {
  test('when no options are specify should throw error', () => {
    const create = () => {
      new ZKLib();
    };

    expect(create).toThrowError('Options required');
  });

  test('when no ip is specify should throw error', () => {
    const create = () => {
      new ZKLib({ ip: '' });
    };

    expect(create).toThrowError('IP option required');
  });

  test('when no ip is specify should throw error', () => {
    const create = () => {
      new ZKLib({ ip: '12', inport: 0 });
    };

    expect(create).toThrowError('Inport option required');
  });

  test('when attendanceParser is not valid should throw error', () => {
    const create = () => {
      new ZKLib({ ip: '12', inport: 12, attendanceParser: 'other' });
    };

    expect(create).toThrowError('Attendance parser option unknown');
  });

  test('when attendanceParser is valid should not throw error', () => {
    const create = () => {
      new ZKLib({ ip: '12', inport: 12, attendanceParser: 'legacy' });
    };

    expect(create).not.toThrowError();
  });

  test('when attendanceParser is not specify it should return legacy as default', () => {
    const zk = new ZKLib({ ip: '12', inport: 12 });

    expect(zk.attendanceParser).toBe('legacy');
  });
});
