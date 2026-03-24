import { expect, it, describe } from '@jest/globals';
import { Flagship } from '../../src/main/Flagship';
import { FSSdkStatus, LogLevel } from '../../src';

describe('Functional test decision API mode', () => {
  const envId = process.env.FS_ENV_ID as string;
  const apiKey = process.env.FS_API_KEY as string;

  async function startSDK() {
    if (Flagship.getStatus() !== FSSdkStatus.SDK_NOT_INITIALIZED) {
      return;
    }
    await Flagship.start(envId, apiKey, {
      logLevel: LogLevel.DEBUG,
      fetchNow: false
    });
  }

  it('should return flag value for allocated visitor in API mode', async () => {
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

  it('should return default value for unallocated visitor in API mode', async () => {
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

  it('should return default value when visitor context does not match targeting in API mode', async () => {
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
