import { expect, it, describe } from '@jest/globals';
import { Flagship } from '../../src/main/Flagship';
import { DecisionMode } from '../../src/config';
import { FSSdkStatus } from '../../src/enum/FSSdkStatus';
import { LogLevel } from '../../src/enum/LogLevel';

describe('Functional test Bucketing mode', () => {
  const envId = process.env.FS_ENV_ID as string;
  const apiKey = process.env.FS_API_KEY as string;

  async function startSDK() {
    if (Flagship.getStatus() !== FSSdkStatus.SDK_NOT_INITIALIZED) {
      return;
    }
    await Flagship.start(envId, apiKey, {
      logLevel: LogLevel.DEBUG,
      fetchNow: false,
      decisionMode: DecisionMode.BUCKETING
    });
  }
  it('test decision Bucketing mode', async () => {
    await startSDK();
    const visitor = Flagship.newVisitor({
      hasConsented: true,
      visitorId: 'visitor-1',
      context: {
        'ci-test': true,
        'test-ab': true
      }
    });

    await visitor.fetchFlags();

    const defaultValue = 'default-value';
    const flag = visitor.getFlag('ci_flag_1');

    await Flagship.close();

    expect(flag.getValue(defaultValue, false)).toBe('flag-1-value-2');
    expect(flag.metadata.campaignName).toBe('Test-campaign ab');
  });

  it('test decision Bucketing mode 2', async () => {
    await startSDK();
    const visitor = Flagship.newVisitor({
      hasConsented: true,
      visitorId: 'visitor-6',
      context: {
        'ci-test': true,
        'test-ab': true
      }
    });

    await visitor.fetchFlags();

    const defaultValue = 'default-value';
    const flag = visitor.getFlag('ci_flag_1');

    await Flagship.close();

    expect(flag.getValue(defaultValue, false)).toBe(defaultValue);
    expect(flag.metadata.campaignName).toBe('Test-campaign ab');
  });

  it('test decision Bucketing mode 3', async () => {
    await startSDK();
    const visitor = Flagship.newVisitor({
      hasConsented: true,
      visitorId: 'visitor-6',
      context: {
        'ci-test': true,
        'test-ab': false
      }
    });

    await visitor.fetchFlags();

    const defaultValue = 'default-value';
    const flag = visitor.getFlag('ci_flag_1');

    await Flagship.close();

    expect(flag.getValue(defaultValue, false)).toBe(defaultValue);
    expect(flag.metadata.campaignName).toBe('');
  });
});
