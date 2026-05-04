const hap = require('@homebridge/hap-nodejs');

const Alarm = require('./alarm');

describe('Alarm', () => {
  const homebridge = { hap };
  const logger = { info: jest.fn(), debug: jest.fn() };
  const config = {
    statusType: 'DISARMED',
  };
  const installation = {
    config: { alias: 'Kungsgatan' },
    client: null,
  };
  const platformConfig = {
    alarmCode: '000000',
  };
  const { SecuritySystemCurrentState } = hap.Characteristic;
  const alarm = new Alarm(
    homebridge,
    logger,
    config,
    installation,
    platformConfig
  );

  alarm.getServices();

  it('setup name', () => {
    expect(alarm.name).toBe('Alarm - Kungsgatan');
  });

  it('resolves arm states', () => {
    expect(alarm.resolveArmState('ARMED_AWAY')).toBe(
      SecuritySystemCurrentState.AWAY_ARM
    );
    expect(alarm.resolveArmState('ARMED_HOME')).toBe(
      SecuritySystemCurrentState.STAY_ARM
    );
    expect(alarm.resolveArmState('DISARMED')).toBe(
      SecuritySystemCurrentState.DISARMED
    );

    expect(alarm.resolveArmState(SecuritySystemCurrentState.AWAY_ARM)).toBe(
      'ARMED_AWAY'
    );
    expect(alarm.resolveArmState(SecuritySystemCurrentState.STAY_ARM)).toBe(
      'ARMED_HOME'
    );
    expect(alarm.resolveArmState(SecuritySystemCurrentState.DISARMED)).toBe(
      'DISARMED'
    );

    expect(() => alarm.resolveArmState('FOOBAR')).toThrow();
  });

  it('requests current arm state', async () => {
    expect.assertions(1);
    installation.client = jest.fn();
    installation.client.mockResolvedValueOnce({
      installation: {
        armState: {
          statusType: 'ARMED_AWAY',
        },
      },
    });
    const value = await alarm.getCurrentAlarmState();
    expect(value).toBe(SecuritySystemCurrentState.AWAY_ARM);
  });

  it('sets target arm state', async () => {
    expect.assertions(2);
    installation.client = jest.fn();
    installation.client.mockResolvedValueOnce({
      transactionId: 'asd123',
    });
    installation.client.mockResolvedValueOnce({
      installation: {
        pollResult: {
          result: 'OK',
        },
      },
    });

    await alarm.setTargetAlarmState(SecuritySystemCurrentState.AWAY_ARM);

    const { calls } = installation.client.mock;
    expect(calls.length).toBe(2);

    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(
      alarm.service.getCharacteristic(SecuritySystemCurrentState).value
    ).toBe(SecuritySystemCurrentState.AWAY_ARM);
  });
});
