import { expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src'
import { ANONYMOUS_ID, CUSTOMER_ENV_ID_API_ACTIVATE, SDK_APP, VARIATION_GROUP_ID_API_ITEM_ACTIVATE, VARIATION_ID_API_ITEM, VISITOR_ID_API_ITEM } from '../../src/enum'
import { Activate, ERROR_MESSAGE } from '../../src/hit/Activate'

describe('test hit type Activate', () => {
  const variationGroupId = 'variationGroupId'
  const visitorId = 'visitorID'
  const variationId = 'variationId'
  const flagKey = 'flagKey'
  const flagValue = 'value'
  const flagDefaultValue = 'default-value'
  const flagMetadata = {
    campaignId: 'campaignId',
    variationGroupId: 'variationGrID',
    variationId: 'varId',
    isReference: true,
    campaignType: 'ab',
    slug: 'slug'
  }
  const visitorContext = { key: 'value' }
  const activate = new Activate({
    variationGroupId,
    variationId,
    visitorId,
    flagKey,
    flagValue,
    flagDefaultValue,
    flagMetadata,
    visitorContext
  })

  const anonymousId = 'anonymousId'
  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })

  it('test constructor', () => {
    expect(activate.variationGroupId).toBe(variationGroupId)
    expect(activate.variationId).toBe(variationId)
    expect(activate.getErrorMessage()).toBe(ERROR_MESSAGE)
  })

  it('test isReady method false ', () => {
    expect(activate.isReady()).toBeFalsy()
  })

  it('test isReady method true', () => {
    activate.visitorId = visitorId
    activate.config = config
    activate.ds = SDK_APP
    activate.anonymousId = anonymousId
    expect(activate.isReady()).toBeTruthy()
    expect(activate.isReady(false)).toBeTruthy()
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiKeys: Record<string, unknown> = {
    [VISITOR_ID_API_ITEM]: visitorId,
    [VARIATION_ID_API_ITEM]: variationId,
    [VARIATION_GROUP_ID_API_ITEM_ACTIVATE]: variationGroupId,
    [CUSTOMER_ENV_ID_API_ACTIVATE]: config.envId,
    [ANONYMOUS_ID]: null
  }

  it('test toApiKeys method ', () => {
    activate.anonymousId = null
    expect(activate.toApiKeys()).toEqual(apiKeys)
  })
  it('test toApiKeys method ', () => {
    activate.anonymousId = anonymousId
    apiKeys[VISITOR_ID_API_ITEM] = visitorId
    apiKeys[ANONYMOUS_ID] = anonymousId
    expect(activate.toApiKeys()).toEqual(apiKeys)
  })

  it('test toObject', () => {
    const userIp = '127.0.0.1'
    const screenResolution = '800X600'
    const locale = 'fr'
    const sessionNumber = '12345'
    const hitKey = 'key'
    activate.userIp = userIp
    activate.screenResolution = screenResolution
    activate.locale = locale
    activate.sessionNumber = sessionNumber
    activate.key = hitKey
    expect(activate.toObject()).toEqual({
      variationId,
      userIp,
      screenResolution,
      locale,
      sessionNumber,
      variationGroupId,
      key: hitKey,
      createdAt: expect.anything(),
      anonymousId,
      ds: SDK_APP,
      type: 'ACTIVATE',
      visitorId
    })
  })
})
