import { expect, it, describe } from '@jest/globals'
import { Flagship } from '../../src/main/Flagship'

describe('Functional test decision API mode', () => {
  const envId = process.env.FS_ENV_ID as string
  const apiKey = process.env.FS_API_KEY as string
  Flagship.start(envId, apiKey)
  it('test decision API mode', async () => {
    const visitor = Flagship.newVisitor({
      hasConsented: true,
      visitorId: 'visitor-1',
      context: {
        'ci-test': true,
        'test-ab': true
      }
    })

    await visitor.fetchFlags()

    const defaultValue = 'default-value'
    const flag = visitor.getFlag('ci_flag_1')

    await Flagship.close()

    expect(flag.getValue(defaultValue, false)).toBe('flag-1-value-2')
    expect(flag.metadata.campaignName).toBe('Test-campaign ab')
  })

  it('test decision API mode 2', async () => {
    const visitor = Flagship.newVisitor({
      hasConsented: true,
      visitorId: 'visitor-6',
      context: {
        'ci-test': true,
        'test-ab': true
      }
    })

    await visitor.fetchFlags()

    const defaultValue = 'default-value'
    const flag = visitor.getFlag('ci_flag_1')

    await Flagship.close()

    expect(flag.getValue(defaultValue, false)).toBe(defaultValue)
    expect(flag.metadata.campaignName).toBe('Test-campaign ab')
  })

  it('test decision API mode 3', async () => {
    const visitor = Flagship.newVisitor({
      hasConsented: true,
      visitorId: 'visitor-6',
      context: {
        'ci-test': true,
        'test-ab': false
      }
    })

    await visitor.fetchFlags()

    const defaultValue = 'default-value'
    const flag = visitor.getFlag('ci_flag_1')

    await Flagship.close()

    expect(flag.getValue(defaultValue, false)).toBe(defaultValue)
    expect(flag.metadata.campaignName).toBe('')
  })
})
