import { expect, it, describe } from '@jest/globals'
import { Flagship } from '../../src/main/Flagship'
import { DecisionMode } from '../../src/config'
import { sleep } from '../../src/utils/utils'

describe('Functional test Bucketing mode', () => {
  const envId = process.env.FS_ENV_ID as string
  const apiKey = process.env.FS_API_KEY as string
  Flagship.start(envId, apiKey, {
    decisionMode: DecisionMode.BUCKETING
  })
  it('test decision Bucketing mode', async () => {
    await sleep(500)
    const visitor = Flagship.newVisitor({
      visitorId: 'visitor-1',
      context: {
        'ci-test': true,
        'test-ab': true
      }
    })

    await visitor.fetchFlags()

    const defaultValue = 'default-value'
    const flag = visitor.getFlag('ci_flag_1', defaultValue)

    await Flagship.close()

    expect(flag.getValue(false)).toBe('flag-1-value-2')
    expect(flag.metadata.campaignName).toBe('Test-campaign ab')
  })

  it('test decision Bucketing mode 2', async () => {
    await sleep(500)
    const visitor = Flagship.newVisitor({
      visitorId: 'visitor-6',
      context: {
        'ci-test': true,
        'test-ab': true
      }
    })

    await visitor.fetchFlags()

    const defaultValue = 'default-value'
    const flag = visitor.getFlag('ci_flag_1', defaultValue)

    await Flagship.close()

    expect(flag.getValue(false)).toBe(defaultValue)
    expect(flag.metadata.campaignName).toBe('Test-campaign ab')
  })

  it('test decision Bucketing mode 3', async () => {
    await sleep(500)
    const visitor = Flagship.newVisitor({
      visitorId: 'visitor-6',
      context: {
        'ci-test': true,
        'test-ab': false
      }
    })

    await visitor.fetchFlags()

    const defaultValue = 'default-value'
    const flag = visitor.getFlag('ci_flag_1', defaultValue)

    await Flagship.close()

    expect(flag.getValue(false)).toBe(defaultValue)
    expect(flag.metadata.campaignName).toBe('')
  })
})
