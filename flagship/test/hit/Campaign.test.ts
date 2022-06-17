import { expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src'
import { CAMPAIGN_ID, CUSTOMER_ENV_ID_API_ITEM, CUSTOMER_UID, DS_API_ITEM, HitType, QT_API_ITEM, SDK_APP, T_API_ITEM, VARIATION_GROUP_ID_API_ITEM, VISITOR_ID_API_ITEM } from '../../src/enum'
import { Campaign, ERROR_MESSAGE } from '../../src/hit/Campaign'

describe('test hit type Campaign', () => {
  const variationGroupId = 'variationGroupId'
  const campaignId = 'campaignId'
  const campaign = new Campaign({ variationGroupId, campaignId })
  const visitorId = 'visitorID'
  const anonymousId = 'anonymousId'
  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })

  it('test constructor', () => {
    expect(campaign.variationGroupId).toBe(variationGroupId)
    expect(campaign.campaignId).toBe(campaignId)
    expect(campaign.getErrorMessage()).toBe(ERROR_MESSAGE)
  })

  it('test isReady method false ', () => {
    expect(campaign.isReady()).toBeFalsy()
  })

  it('test isReady method true', () => {
    campaign.visitorId = visitorId
    campaign.config = config
    campaign.ds = SDK_APP
    campaign.anonymousId = anonymousId
    expect(campaign.isReady()).toBeTruthy()
    expect(campaign.isReady(false)).toBeTruthy()
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiKeys: Record<string, unknown> = {
    [VISITOR_ID_API_ITEM]: anonymousId,
    [DS_API_ITEM]: SDK_APP,
    [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
    [T_API_ITEM]: HitType.CAMPAIGN,
    [VARIATION_GROUP_ID_API_ITEM]: variationGroupId,
    [CAMPAIGN_ID]: campaignId,
    [CUSTOMER_UID]: visitorId,
    [QT_API_ITEM]: expect.anything()
  }

  it('test toApiKeys method ', () => {
    expect(campaign.toApiKeys()).toEqual(apiKeys)
  })

  it('test toObject', () => {
    const userIp = '127.0.0.1'
    const screenResolution = '800X600'
    const locale = 'fr'
    const sessionNumber = '12345'
    const hitKey = 'key'
    campaign.userIp = userIp
    campaign.screenResolution = screenResolution
    campaign.locale = locale
    campaign.sessionNumber = sessionNumber
    campaign.key = hitKey
    expect(campaign.toObject()).toEqual({
      campaignId,
      userIp,
      screenResolution,
      locale,
      sessionNumber,
      variationGroupId,
      key: hitKey,
      createdAt: expect.anything(),
      anonymousId,
      ds: SDK_APP,
      type: HitType.CAMPAIGN,
      visitorId
    })
  })
})
