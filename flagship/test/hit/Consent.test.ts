import { expect, it, describe } from '@jest/globals'
import { DecisionApiConfig } from '../../src'
import { CUSTOMER_ENV_ID_API_ITEM, CUSTOMER_UID, DS_API_ITEM, HitType, QT_API_ITEM, SDK_APP, T_API_ITEM, VISITOR_CONSENT, VISITOR_ID_API_ITEM } from '../../src/enum'
import { Consent, ERROR_MESSAGE } from '../../src/hit/Consent'

describe('test hit type Campaign', () => {
  const consentHit = new Consent({ visitorConsent: true })
  const visitorId = 'visitorID'
  const anonymousId = 'anonymousId'
  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })

  it('test constructor', () => {
    expect(consentHit.visitorConsent).toBe(true)
    expect(consentHit.getErrorMessage()).toBe(ERROR_MESSAGE)
  })

  it('test isReady method false ', () => {
    expect(consentHit.isReady()).toBeFalsy()
  })

  it('test isReady method true', () => {
    consentHit.visitorId = visitorId
    consentHit.config = config
    consentHit.ds = SDK_APP
    consentHit.anonymousId = anonymousId
    expect(consentHit.isReady()).toBeTruthy()
    expect(consentHit.isReady(false)).toBeTruthy()
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiKeys: Record<string, unknown> = {
    [VISITOR_ID_API_ITEM]: anonymousId,
    [DS_API_ITEM]: SDK_APP,
    [CUSTOMER_ENV_ID_API_ITEM]: config.envId,
    [T_API_ITEM]: HitType.CONSENT,
    [VISITOR_CONSENT]: true,
    [CUSTOMER_UID]: visitorId,
    [QT_API_ITEM]: expect.anything()
  }

  it('test toApiKeys method ', () => {
    expect(consentHit.toApiKeys()).toEqual(apiKeys)
  })

  it('test toObject', () => {
    const userIp = '127.0.0.1'
    const screenResolution = '800X600'
    const locale = 'fr'
    const sessionNumber = '12345'
    const hitKey = 'key'
    consentHit.userIp = userIp
    consentHit.screenResolution = screenResolution
    consentHit.locale = locale
    consentHit.sessionNumber = sessionNumber
    consentHit.key = hitKey
    expect(consentHit.toObject()).toEqual({
      userIp,
      screenResolution,
      locale,
      sessionNumber,
      visitorConsent: true,
      key: hitKey,
      createdAt: expect.anything(),
      anonymousId,
      ds: SDK_APP,
      type: HitType.CONSENT,
      visitorId
    })
  })
})
