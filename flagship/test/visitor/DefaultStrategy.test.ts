import { AUTHENTICATE, CONTEXT_KEY_ERROR, FLAG_USER_EXPOSED, VISITOR_AUTHENTICATE_VISITOR_ID_ERROR, UNAUTHENTICATE, FLAG_METADATA, METHOD_DEACTIVATED_BUCKETING_ERROR, PROCESS_FETCHING_FLAGS } from './../../src/enum/FlagshipConstant'
import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals'
import { DecisionApiConfig, Event, EventCategory, FlagDTO, FlagMetadata, Screen, TroubleshootingLabel } from '../../src/index'
import { TrackingManager } from '../../src/api/TrackingManager'
import { BucketingConfig, ConfigManager } from '../../src/config/index'
import { ApiManager } from '../../src/decision/ApiManager'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { IHttpResponse, HttpClient } from '../../src/utils/HttpClient'
import { DefaultStrategy, HIT_NULL_ERROR, TYPE_HIT_REQUIRED_ERROR } from '../../src/visitor/DefaultStrategy'
import { VisitorDelegate } from '../../src/visitor/VisitorDelegate'
import { ACTIVATE_MODIFICATION_ERROR, ACTIVATE_MODIFICATION_KEY_ERROR, CONTEXT_NULL_ERROR, CONTEXT_VALUE_ERROR, FLAGSHIP_VISITOR_NOT_AUTHENTICATE, FLAG_VALUE, FS_CONSENT, FlagSynchStatus, GET_FLAG_CAST_ERROR, GET_FLAG_MISSING_ERROR, GET_METADATA_CAST_ERROR, GET_MODIFICATION_CAST_ERROR, GET_MODIFICATION_ERROR, GET_MODIFICATION_KEY_ERROR, GET_MODIFICATION_MISSING_ERROR, HitType, PROCESS_ACTIVE_MODIFICATION, PROCESS_GET_MODIFICATION, PROCESS_GET_MODIFICATION_INFO, PROCESS_SEND_HIT, PROCESS_UPDATE_CONTEXT, SDK_APP, SDK_INFO, TRACKER_MANAGER_MISSING_ERROR, USER_EXPOSED_CAST_ERROR, USER_EXPOSED_FLAG_ERROR } from '../../src/enum'
import { errorFormat, sprintf } from '../../src/utils/utils'
import { returnModification } from './modification'
import { HitShape } from '../../src/hit/Legacy'
import { Activate } from '../../src/hit/Activate'
import { MurmurHash } from '../../src/utils/MurmurHash'
import { BucketingManager } from '../../src/decision/BucketingManager'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNull = (): any => {
  return null
}

describe('test DefaultStrategy ', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')
  const logInfo = jest.spyOn(logManager, 'info')
  const logWarning = jest.spyOn(logManager, 'warning')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0, fetchFlagsBufferingTime: 0 })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const getModifications = jest.spyOn(
    apiManager,
    'getModifications'
  )

  const trackingManager = new TrackingManager(httpClient, config)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit')

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')
  activateFlag.mockResolvedValue()

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const murmurHash = new MurmurHash()
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager })
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  const predefinedContext = {
    fs_client: SDK_INFO.name,
    fs_version: SDK_INFO.version,
    fs_users: visitorDelegate.visitorId
  }

  const newContext = {
    local: 'fr',
    color: 'red'
  }

  it('test setConsent hasTrackingManager', () => {
    configManager.trackingManager = getNull()
    defaultStrategy.setConsent(true)
    expect(visitorDelegate.hasConsented).toBeTruthy()
    expect(addHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      TRACKER_MANAGER_MISSING_ERROR,
      'setConsent'
    )
    configManager.trackingManager = trackingManager
  })

  it('test setConsent', () => {
    addHit.mockResolvedValue()
    defaultStrategy.setConsent(true)
    expect(visitorDelegate.hasConsented).toBeTruthy()
    expect(addHit).toBeCalledTimes(1)

    const consentHit = new Event({
      visitorId: visitorDelegate.visitorId,
      label: `${SDK_INFO.name}:${visitorDelegate.hasConsented}`,
      action: FS_CONSENT,
      category: EventCategory.USER_ENGAGEMENT
    })
    consentHit.ds = SDK_APP
    consentHit.config = config

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(addHit).toBeCalledWith({ ...consentHit, _visitorInstanceId: expect.anything() })
  })

  it('test updateContext', () => {
    defaultStrategy.updateContext(newContext)
    expect(visitorDelegate.context).toStrictEqual({ ...context, ...newContext, ...predefinedContext })
    expect(visitorDelegate.flagSynchStatus).toBe(FlagSynchStatus.CONTEXT_UPDATED)
  })

  it('test updateContext null', () => {
    defaultStrategy.updateContext(getNull())
    expect(visitorDelegate.context).toStrictEqual({ ...context, ...newContext, ...predefinedContext })
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(CONTEXT_NULL_ERROR, PROCESS_UPDATE_CONTEXT)
  })

  it('test updateContext invalid context key', () => {
    defaultStrategy.updateContext('', 'value')
    expect(visitorDelegate.context).toStrictEqual({ ...context, ...newContext, ...predefinedContext })
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(CONTEXT_KEY_ERROR, visitorDelegate.visitorId, ''),
      PROCESS_UPDATE_CONTEXT
    )
  })

  it('test updateContext invalid context value', () => {
    defaultStrategy.updateContext('key', {} as string)
    expect(visitorDelegate.context).toStrictEqual({ ...context, ...newContext, ...predefinedContext })
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(CONTEXT_VALUE_ERROR, visitorDelegate.visitorId, 'key'),
      PROCESS_UPDATE_CONTEXT
    )
  })

  it('test updateContext key/value', () => {
    const key = 'newKey'
    const value = 'newValue'
    defaultStrategy.updateContext(key, value)
    expect(visitorDelegate.context).toStrictEqual({ ...context, ...newContext, ...predefinedContext, ...{ [key]: value } })
  })
  it('test clear Context', () => {
    defaultStrategy.clearContext()
    expect(visitorDelegate.context).toEqual({
      fs_client: SDK_INFO.name,
      fs_version: SDK_INFO.version,
      fs_users: visitorId
    })
  })

  const campaignDtoId = 'c2nrh1hjg50l9stringgu8bg'
  const campaignDTO = [
    {
      id: campaignDtoId,
      slug: 'slug',
      variationGroupId: 'id',
      variation: {
        id: '1dl',
        reference: false,
        modifications: {
          type: 'number',
          value: 12
        }
      }
    }
  ]

  it('test synchronizeModifications', async () => {
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeUndefined()
    })
    getCampaignsAsync.mockResolvedValue(campaignDTO)
    getModifications.mockReturnValue(returnModification)
    await defaultStrategy.synchronizeModifications()
    expect(getCampaignsAsync).toBeCalledTimes(1)
    expect(getCampaignsAsync).toBeCalledWith(visitorDelegate)
    expect(getModifications).toBeCalledTimes(1)
    expect(getModifications).toBeCalledWith(campaignDTO)
  })

  it('test fetchFlags', async () => {
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeUndefined()
    })
    getCampaignsAsync.mockResolvedValue(campaignDTO)
    getModifications.mockReturnValue(returnModification)
    await defaultStrategy.fetchFlags()
    expect(getCampaignsAsync).toBeCalledTimes(1)
    expect(getCampaignsAsync).toBeCalledWith(visitorDelegate)
    expect(getModifications).toBeCalledTimes(1)
    expect(getModifications).toBeCalledWith(campaignDTO)
    expect(visitorDelegate.flagSynchStatus).toBe(FlagSynchStatus.FLAGS_FETCHED)
  })

  const testModificationType = async <T>(
    key: string,
    defaultValue: T,
    activate = false
  ) => {
    const returnMod = returnModification.get(key) as FlagDTO
    const modification = await defaultStrategy.getModification(
      {
        key: returnMod.key,
        defaultValue,
        activate
      }
    )
    expect<T>(modification).toEqual(returnMod.value)
  }

  const testModificationTypeArray = async <T>(
    params: {
      key: string,
      defaultValue: T,
      activate?: boolean
    }[], activateAll = false
  ) => {
    const returnMod: Record<string, T> = {}
    params.forEach(item => {
      returnMod[item.key] = (returnModification.get(item.key) as FlagDTO).value ?? item.defaultValue
    })
    getCampaignsAsync.mockResolvedValue(campaignDTO)
    getModifications.mockReturnValue(returnModification)
    await defaultStrategy.fetchFlags()
    const modifications = await defaultStrategy.getModifications(params, activateAll)

    expect<Record<string, T>>(modifications).toEqual(returnMod)
  }

  const testModificationErrorCast = <T>(
    key: string,
    defaultValue: T,
    activate = false
  ) => {
    const returnMod = returnModification.get(key) as FlagDTO
    const modification = defaultStrategy.getModificationSync(
      {
        key: returnMod.key,
        defaultValue,
        activate
      }
    )
    expect<T>(modification).toEqual(defaultValue)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_CAST_ERROR, key),
      PROCESS_GET_MODIFICATION
    )
  }

  const testModificationWithDefault = <T>(
    key: string,
    defaultValue: T,
    activate = false
  ) => {
    const modification = defaultStrategy.getModificationSync(
      {
        key,
        defaultValue,
        activate
      }
    )
    expect<T>(modification).toEqual(defaultValue)
  }

  it('test getModification key string', () => {
    testModificationType('keyString', 'defaultString')
  })

  it('test getFlagValue', () => {
    const returnMod = returnModification.get('keyString') as FlagDTO
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue: 'defaultValues', flag: returnMod })
    expect<string>(value).toBe(returnMod.value)
  })

  it('test getFlagValue', () => {
    const returnMod = {
      key: 'keyBoolean',
      campaignId: 'c2nrh1hjg50l9thhu8bgkeyB',
      variationGroupId: 'c2nrh1hjg50l9thhu8cgKeyBoolean',
      variationId: 'c2nrh1hjg50l9thhu8dg',
      isReference: false,
      value: false
    }
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue: true, flag: returnMod })
    expect(value).toBe(returnMod.value)
  })

  it('test getFlagValue', () => {
    const returnMod = {
      key: 'keyBoolean',
      campaignId: 'c2nrh1hjg50l9thhu8bgkeyB',
      variationGroupId: 'c2nrh1hjg50l9thhu8cgKeyBoolean',
      variationId: 'c2nrh1hjg50l9thhu8dg',
      isReference: false,
      value: 0
    }
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue: 1, flag: returnMod })
    expect(value).toBe(returnMod.value)
  })

  it('test getFlagValue', () => {
    const returnMod = returnModification.get('keyString') as FlagDTO
    const defaultValue = 'defaultValues'
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue: 'defaultValues', flag: returnMod, userExposed: true })
    expect<string>(value).toBe(returnMod.value)
    expect(activateFlag).toBeCalledTimes(1)
    const activateHit = new Activate({
      variationGroupId: returnMod.variationGroupId,
      variationId: returnMod.variationId,
      visitorId,
      flagKey: returnMod.key,
      flagValue: returnMod.value,
      flagDefaultValue: defaultValue,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: returnMod.campaignId,
        variationGroupId: returnMod.variationGroupId,
        variationId: returnMod.variationId,
        isReference: returnMod.isReference as boolean,
        campaignType: returnMod.campaignType as string,
        slug: returnMod.slug
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activateHit.traffic = expect.anything() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activateHit.visitorInstanceId = expect.anything() as any
    activateHit.config = config
    activateHit.ds = SDK_APP
    expect(activateFlag).toBeCalledWith(activateHit)
  })

  it('test getFlagValue with defaultValue null', () => {
    const returnMod = returnModification.get('keyString') as FlagDTO
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue: null, flag: returnMod, userExposed: true })
    expect(value).toBe(returnMod.value)
    expect(activateFlag).toBeCalledTimes(1)
    const campaignHit = new Activate({
      variationGroupId: returnMod.variationGroupId,
      variationId: returnMod.variationId,
      visitorId,
      flagKey: returnMod.key,
      flagValue: returnMod.value,
      flagDefaultValue: null,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: returnMod.campaignId,
        variationGroupId: returnMod.variationGroupId,
        variationId: returnMod.variationId,
        isReference: returnMod.isReference as boolean,
        campaignType: returnMod.campaignType as string,
        slug: returnMod.slug
      }
    })
    campaignHit.config = config
    campaignHit.ds = SDK_APP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    campaignHit.traffic = expect.anything() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    campaignHit.visitorInstanceId = expect.anything() as any
    expect(activateFlag).toBeCalledWith(campaignHit)
    expect(logInfo).toBeCalledTimes(0)
  })

  it('test getFlagValue with defaultValue undefined', () => {
    const returnMod = returnModification.get('keyString') as FlagDTO
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue: undefined, flag: returnMod, userExposed: true })
    expect(value).toBe(returnMod.value)
    expect(activateFlag).toBeCalledTimes(1)
    const campaignHit = new Activate({
      variationGroupId: returnMod.variationGroupId,
      variationId: returnMod.variationId,
      visitorId,
      flagKey: returnMod.key,
      flagValue: returnMod.value,
      flagDefaultValue: undefined,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: returnMod.campaignId,
        variationGroupId: returnMod.variationGroupId,
        variationId: returnMod.variationId,
        isReference: returnMod.isReference as boolean,
        campaignType: returnMod.campaignType as string,
        slug: returnMod.slug
      }
    })
    campaignHit.config = config
    campaignHit.ds = SDK_APP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    campaignHit.traffic = expect.anything() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    campaignHit.visitorInstanceId = expect.anything() as any
    expect(activateFlag).toBeCalledWith(campaignHit)
    expect(logInfo).toBeCalledTimes(0)
  })

  it('test getFlagValue with defaultValue undefined', () => {
    const returnMod = returnModification.get('keyNull') as FlagDTO
    const defaultValue = undefined
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue, flag: returnMod, userExposed: true })
    expect(value).toBe(defaultValue)
    expect(activateFlag).toBeCalledTimes(1)
    const campaignHit = new Activate({
      variationGroupId: returnMod.variationGroupId,
      variationId: returnMod.variationId,
      visitorId,
      flagKey: returnMod.key,
      flagValue: returnMod.value,
      flagDefaultValue: defaultValue,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: returnMod.campaignId,
        variationGroupId: returnMod.variationGroupId,
        variationId: returnMod.variationId,
        isReference: returnMod.isReference as boolean,
        campaignType: returnMod.campaignType as string,
        slug: returnMod.slug
      }
    })
    campaignHit.config = config
    campaignHit.visitorId = visitorId
    campaignHit.ds = SDK_APP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    campaignHit.traffic = expect.anything() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    campaignHit.visitorInstanceId = expect.anything() as any
    expect(activateFlag).toBeCalledWith(campaignHit)
    expect(logInfo).toBeCalledTimes(0)
  })

  it('test getFlagValue undefined flag with default value null', () => {
    const returnMod = returnModification.get('keyString') as FlagDTO
    const defaultValue = null
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue })
    expect(value).toBe(defaultValue)
    expect(activateFlag).toBeCalledTimes(0)
    expect(logWarning).toBeCalledTimes(1)
    expect(logWarning).toBeCalledWith(sprintf(GET_FLAG_MISSING_ERROR, visitorId, 'keyString', defaultValue), FLAG_VALUE)
  })

  it('test getFlagValue undefined flag', () => {
    const returnMod = returnModification.get('keyString') as FlagDTO
    const defaultValue = 'defaultValues'
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue })
    expect<string>(value).toBe(defaultValue)
    expect(activateFlag).toBeCalledTimes(0)
    expect(logWarning).toBeCalledTimes(1)
    expect(logWarning).toBeCalledWith(sprintf(GET_FLAG_MISSING_ERROR, visitorId, 'keyString', defaultValue), FLAG_VALUE)
    expect(sendTroubleshootingHit).toBeCalledTimes(1)
    const label: TroubleshootingLabel = 'GET-FLAG-VALUE-FLAG-NOT-FOUND'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  it('test getFlagValue castError type', () => {
    const returnMod = returnModification.get('keyString') as FlagDTO
    const defaultValue = 1
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue, flag: returnMod })
    expect(value).toBe(defaultValue)
    expect(activateFlag).toBeCalledTimes(0)
    expect(logWarning).toBeCalledTimes(1)
    expect(logWarning).toBeCalledWith(sprintf(GET_FLAG_CAST_ERROR, visitorId, 'keyString', defaultValue), FLAG_VALUE)
    expect(sendTroubleshootingHit).toBeCalledTimes(1)
    const label: TroubleshootingLabel = 'GET-FLAG-VALUE-TYPE-WARNING'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  it('test getFlagValue castError type', () => {
    const returnMod = returnModification.get('keyNull') as FlagDTO
    const defaultValue = 1
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue, flag: returnMod, userExposed: true })
    expect(value).toBe(defaultValue)
    expect(activateFlag).toBeCalledTimes(1)
  })

  it('test getFlagValue castError type', () => {
    const returnMod = returnModification.get('array') as FlagDTO
    const defaultValue = {}
    const value = defaultStrategy.getFlagValue({ key: returnMod.key, defaultValue, flag: returnMod })
    expect(value).toEqual(defaultValue)
    expect(logWarning).toBeCalledTimes(1)
    expect(logWarning).toBeCalledWith(sprintf(GET_FLAG_CAST_ERROR, visitorId, 'array', defaultValue), FLAG_VALUE)
    expect(activateFlag).toBeCalledTimes(0)
  })

  it('test getFlagMetadata', () => {
    const key = 'key'
    const metadata:FlagMetadata = {
      campaignId: 'campaignID',
      variationGroupId: 'variationGroupId',
      variationId: 'variationId',
      isReference: false,
      campaignType: 'ab',
      slug: 'slug'
    }
    const flagMeta = defaultStrategy.getFlagMetadata({ key, metadata, hasSameType: true })
    expect(flagMeta).toEqual(metadata)
    expect(logInfo).toBeCalledTimes(0)
  })

  it('test getFlagMetadata with different type', () => {
    const key = 'key'
    const metadata:FlagMetadata = {
      campaignId: 'campaignID',
      variationGroupId: 'variationGroupId',
      variationId: 'variationId',
      isReference: false,
      campaignType: 'ab',
      slug: 'slug'
    }
    const flagMeta = defaultStrategy.getFlagMetadata({ key, metadata, hasSameType: false })
    expect(flagMeta).toEqual(FlagMetadata.Empty())
    expect(logWarning).toBeCalledTimes(1)
    expect(logWarning).toBeCalledWith(sprintf(GET_METADATA_CAST_ERROR, key), FLAG_METADATA)
    expect(sendTroubleshootingHit).toBeCalledTimes(1)
    const label: TroubleshootingLabel = 'GET-FLAG-METADATA-TYPE-WARNING'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  it('test getModification with array 1', async () => {
    await testModificationTypeArray<string | number>([
      { key: 'keyString', defaultValue: 'defaultString' },
      { key: 'keyNumber', defaultValue: 10 }
    ])
    expect(activateFlag).toBeCalledTimes(0)
  })

  it('test getModification with array and activateAll', async () => {
    await testModificationTypeArray<string | number>([
      { key: 'keyString', defaultValue: 'defaultString' },
      { key: 'keyNumber', defaultValue: 10 },
      { key: 'keyNull', defaultValue: 10 }
    ], true)
    expect(activateFlag).toBeCalledTimes(3)
  })

  it('test getModification key keyNumber', () => {
    testModificationType('keyNumber', 10)
  })

  it('test getModification key keyBoolean', () => {
    testModificationType('keyBoolean', false)
  })

  it('test getModification key array', () => {
    testModificationType('array', [])
  })

  it('test getModification key object ', () => {
    testModificationType('object', {})
    testModificationType('complex', {})
  })

  it('test getModification key string with default activate', async () => {
    const returnMod = returnModification.get('keyString') as FlagDTO
    const modification = await defaultStrategy.getModification(
      {
        key: returnMod.key,
        defaultValue: 'defaultValue'
      }
    )
    expect<string>(modification).toEqual(returnMod.value)
    expect(addHit).toBeCalledTimes(0)
  })

  it('test getModification key string with activate ', () => {
    testModificationType('keyString', 'defaultString', true)
    expect(activateFlag).toBeCalledTimes(1)
    const returnMod = returnModification.get('keyString') as FlagDTO
    const activateHit = new Activate({
      variationGroupId: returnMod.variationGroupId,
      variationId: returnMod.variationId,
      visitorId,
      flagKey: returnMod.key,
      flagValue: returnMod.value,
      flagDefaultValue: undefined,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: returnMod.campaignId,
        variationGroupId: returnMod.variationGroupId,
        variationId: returnMod.variationId,
        isReference: returnMod.isReference as boolean,
        campaignType: returnMod.campaignType as string,
        slug: returnMod.slug
      }
    })
    activateHit.config = config
    activateHit.ds = SDK_APP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activateHit.traffic = expect.anything() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activateHit.visitorInstanceId = expect.anything() as any
    expect(activateFlag).toBeCalledWith(activateHit)
  })

  const notExitKey = 'notExitKey'

  it('test getModification test key not exist', () => {
    testModificationWithDefault(notExitKey, 'defaultValue')
    expect(addHit).toBeCalledTimes(0)
    expect(logInfo).toBeCalledTimes(1)
    expect(logInfo).toBeCalledWith(
      sprintf(GET_MODIFICATION_MISSING_ERROR, notExitKey),
      PROCESS_GET_MODIFICATION
    )
  })

  it('test getModification test typeof value of key != defaultValue', () => {
    testModificationErrorCast('keyString', 10)
  })

  it('test getModification test typeof value of key != defaultValue 2', () => {
    testModificationErrorCast('array', 10)
  })

  it('test getModification test typeof value of key != defaultValue 3', () => {
    testModificationErrorCast('array', {})
  })

  it('test getModification test typeof value of key != defaultValue 4', () => {
    testModificationErrorCast('object', [])
  })

  it('test getModification test typeof value of key != defaultValue with activate and modification value = null', () => {
    testModificationErrorCast('keyNull', [], true)
    expect(activateFlag).toBeCalledTimes(1)
  })

  it('test getModification test key == null or key != string ', () => {
    testModificationWithDefault({} as string, 'defaultValue')
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_KEY_ERROR, {}),
      PROCESS_GET_MODIFICATION
    )
  })

  const returnMod = returnModification.get('keyString') as FlagDTO

  it('test getModificationInfo', async () => {
    const modification = await defaultStrategy.getModificationInfo(returnMod.key)
    expect(logError).toBeCalledTimes(0)
    expect(modification).toBeDefined()
    expect(modification).toEqual(returnMod)
  })

  it('test key not exist in getModificationInfo', () => {
    const modification = defaultStrategy.getModificationInfoSync(notExitKey)
    expect(modification).toBeNull()
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_ERROR, notExitKey),
      PROCESS_GET_MODIFICATION_INFO
    )
  })

  it('test key is not valid in getModificationInfo', () => {
    const modification = defaultStrategy.getModificationInfoSync(getNull())
    expect(modification).toBeNull()
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_KEY_ERROR, null),
      PROCESS_GET_MODIFICATION_INFO
    )
  })

  it('test activateModification', async () => {
    await defaultStrategy.activateModification(returnMod.key)
    expect(activateFlag).toBeCalledTimes(1)
    const activateHit = new Activate({
      variationGroupId: returnMod.variationGroupId,
      variationId: returnMod.variationId,
      visitorId,
      flagKey: returnMod.key,
      flagValue: returnMod.value,
      flagDefaultValue: undefined,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: returnMod.campaignId,
        variationGroupId: returnMod.variationGroupId,
        variationId: returnMod.variationId,
        isReference: returnMod.isReference as boolean,
        campaignType: returnMod.campaignType as string,
        slug: returnMod.slug
      }
    })
    activateHit.config = config
    activateHit.ds = SDK_APP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activateHit.traffic = expect.anything() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activateHit.visitorInstanceId = expect.anything() as any
    expect(activateFlag).toBeCalledWith(activateHit)
  })

  it('test activateModification with array key', async () => {
    const key1 = 'keyString'
    const key2 = 'keyNumber'
    await defaultStrategy.activateModifications([{ key: key1 }, { key: key2 }])
    expect(activateFlag).toBeCalledTimes(2)

    const modification1:FlagDTO = returnModification.get(key1) as FlagDTO
    const activateHit = new Activate({
      variationGroupId: modification1.variationGroupId,
      variationId: modification1.variationId,
      visitorId,
      flagKey: modification1.key,
      flagValue: modification1.value,
      flagDefaultValue: undefined,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: modification1.campaignId,
        variationGroupId: modification1.variationGroupId,
        variationId: modification1.variationId,
        isReference: modification1.isReference as boolean,
        campaignType: modification1.campaignType as string,
        slug: modification1.slug
      }
    })
    activateHit.config = config
    activateHit.visitorId = visitorId
    activateHit.ds = SDK_APP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activateHit.traffic = expect.anything() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activateHit.visitorInstanceId = expect.anything() as any
    expect(activateFlag).toHaveBeenNthCalledWith(1, activateHit)

    const modification2:FlagDTO = returnModification.get(key2) as FlagDTO
    const activateHit2 = new Activate({
      variationGroupId: modification2?.variationGroupId,
      variationId: modification2.variationId,
      visitorId,
      flagKey: modification2.key,
      flagValue: modification2.value,
      flagDefaultValue: undefined,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: modification2.campaignId,
        variationGroupId: modification2.variationGroupId,
        variationId: modification2.variationId,
        isReference: modification2.isReference as boolean,
        campaignType: modification2.campaignType as string,
        slug: modification2.slug
      }
    })
    activateHit2.config = config
    activateHit2.visitorId = visitorId
    activateHit2.ds = SDK_APP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activateHit2.traffic = expect.anything() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activateHit2.visitorInstanceId = expect.anything() as any
    expect(activateFlag).toHaveBeenNthCalledWith(2, activateHit2)
  })

  it('test activateModification with array', async () => {
    const key1 = 'keyString'
    const key2 = 'keyNumber'
    await defaultStrategy.activateModifications([key1, key2])
    expect(activateFlag).toBeCalledTimes(2)

    const modification1:FlagDTO = returnModification.get(key1) as FlagDTO
    const campaignHit = new Activate({
      variationGroupId: modification1.variationGroupId,
      variationId: modification1.variationId,
      visitorId,
      flagKey: modification1.key,
      flagValue: modification1.value,
      flagDefaultValue: undefined,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: modification1.campaignId,
        variationGroupId: modification1.variationGroupId,
        variationId: modification1.variationId,
        isReference: modification1.isReference as boolean,
        campaignType: modification1.campaignType as string,
        slug: modification1.slug
      }
    })
    campaignHit.config = config
    campaignHit.visitorId = visitorId
    campaignHit.ds = SDK_APP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    campaignHit.traffic = expect.anything() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    campaignHit.visitorInstanceId = expect.anything() as any

    expect(activateFlag).toHaveBeenNthCalledWith(1, campaignHit)

    const modification2:FlagDTO = returnModification.get(key2) as FlagDTO
    const campaignHit2 = new Activate({
      variationGroupId: modification2.variationGroupId,
      variationId: modification2.variationId,
      visitorId,
      flagKey: modification2.key,
      flagValue: modification2.value,
      flagDefaultValue: undefined,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: modification2.campaignId,
        variationGroupId: modification2.variationGroupId,
        variationId: modification2.variationId,
        isReference: modification2.isReference as boolean,
        campaignType: modification2.campaignType as string,
        slug: modification2.slug
      }
    })
    campaignHit2.config = config
    campaignHit2.visitorId = visitorId
    campaignHit2.ds = SDK_APP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    campaignHit2.traffic = expect.anything() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    campaignHit2.visitorInstanceId = expect.anything() as any
    expect(activateFlag).toHaveBeenNthCalledWith(2, campaignHit2)
  })

  it('test invalid key in activateModification', async () => {
    await defaultStrategy.activateModification(getNull())
    expect(addHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(ACTIVATE_MODIFICATION_KEY_ERROR, getNull()),
      PROCESS_ACTIVE_MODIFICATION
    )
  })

  it('test invalid key in activateModifications', async () => {
    await defaultStrategy.activateModifications(getNull())
    expect(activateFlag).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(GET_MODIFICATION_KEY_ERROR, getNull()),
      PROCESS_ACTIVE_MODIFICATION
    )
  })

  it('test key not exist in activateModification', async () => {
    await defaultStrategy.activateModification(notExitKey)
    expect(activateFlag).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      sprintf(ACTIVATE_MODIFICATION_ERROR, notExitKey),
      PROCESS_ACTIVE_MODIFICATION
    )
  })

  it('test hasTrackingManager activateModification', async () => {
    configManager.trackingManager = getNull()

    await defaultStrategy.activateModification(returnMod.key)

    expect(activateFlag).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      TRACKER_MANAGER_MISSING_ERROR,
      PROCESS_ACTIVE_MODIFICATION
    )

    configManager.trackingManager = trackingManager
  })

  // it('test activateModification failed', async () => {
  //   try {
  //     const error = 'Error'
  //     activateFlag.mockRejectedValue(error)
  //     await defaultStrategy.activateModification(returnMod.key)
  //     expect(activateFlag).toBeCalledTimes(1)
  //   } catch (error) {
  //     expect(logError).toBeCalledTimes(1)
  //     expect(logError).toBeCalledWith(error, PROCESS_ACTIVE_MODIFICATION)
  //   }
  // })

  it('test userExposed', async () => {
    await defaultStrategy.visitorExposed({ key: returnMod.key, flag: returnMod, defaultValue: returnMod.value })
    expect(activateFlag).toBeCalledTimes(1)
    const activateHit = new Activate({
      variationGroupId: returnMod.variationGroupId,
      variationId: returnMod.variationId,
      visitorId,
      flagKey: returnMod.key,
      flagValue: returnMod.value,
      flagDefaultValue: returnMod.value,
      visitorContext: visitorDelegate.context,
      flagMetadata: {
        campaignId: returnMod.campaignId,
        variationGroupId: returnMod.variationGroupId,
        variationId: returnMod.variationId,
        isReference: returnMod.isReference as boolean,
        campaignType: returnMod.campaignType as string,
        slug: returnMod.slug
      }
    })
    activateHit.config = config
    activateHit.visitorId = visitorId
    activateHit.ds = SDK_APP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activateHit.traffic = expect.anything() as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activateHit.visitorInstanceId = expect.anything() as any
    expect(activateFlag).toBeCalledWith(activateHit)
    expect(sendTroubleshootingHit).toBeCalledTimes(1)
    const label: TroubleshootingLabel = 'VISITOR-SEND-ACTIVATE'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  it('test userExposed with onUserExposed callback', async () => {
    const newConfig = new DecisionApiConfig({
      envId: 'envId',
      apiKey: 'apiKey',
      hitDeduplicationTime: 0,
      onUserExposure: ({ flagData: exposedFlag, visitorData }) => {
        expect(exposedFlag).toEqual({
          key: returnMod.key,
          value: returnMod.value,
          metadata: {
            campaignId: returnMod.campaignId,
            campaignType: returnMod.campaignType as string,
            slug: returnMod.slug,
            isReference: !!returnMod.isReference,
            variationGroupId: returnMod.variationGroupId,
            variationId: returnMod.variationId
          }
        })
        expect(visitorData).toEqual({
          visitorId: visitorDelegate.visitorId,
          anonymousId: visitorDelegate.anonymousId,
          context: visitorDelegate.context
        })
      }
    })

    const configManager = new ConfigManager(newConfig, apiManager, trackingManager)

    const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager })
    const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })
    await defaultStrategy.visitorExposed({ key: returnMod.key, flag: returnMod, defaultValue: returnMod.value })
    expect(activateFlag).toBeCalledTimes(1)
  })

  it('test userExposed with different type', async () => {
    await defaultStrategy.visitorExposed({ key: returnMod.key, flag: returnMod, defaultValue: true })
    expect(addHit).toBeCalledTimes(0)
    expect(logWarning).toBeCalledTimes(1)
    expect(logWarning).toBeCalledWith(
      sprintf(USER_EXPOSED_CAST_ERROR, visitorId, returnMod.key),
      FLAG_USER_EXPOSED
    )
    expect(sendTroubleshootingHit).toBeCalledTimes(1)
    const label: TroubleshootingLabel = 'VISITOR-EXPOSED-TYPE-WARNING'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  it('test userExposed flag undefined', async () => {
    await defaultStrategy.visitorExposed({ key: notExitKey, flag: undefined, defaultValue: false })
    expect(activateFlag).toBeCalledTimes(0)
    expect(logWarning).toBeCalledTimes(1)
    expect(logWarning).toBeCalledWith(
      sprintf(USER_EXPOSED_FLAG_ERROR, visitorId, notExitKey),
      FLAG_USER_EXPOSED
    )
    expect(sendTroubleshootingHit).toBeCalledTimes(1)
    const label: TroubleshootingLabel = 'VISITOR-EXPOSED-FLAG-NOT-FOUND'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  it('test hasTrackingManager userExposed', async () => {
    configManager.trackingManager = getNull()

    await defaultStrategy.visitorExposed({ key: returnMod.key, flag: returnMod, defaultValue: returnMod.value })

    expect(activateFlag).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      TRACKER_MANAGER_MISSING_ERROR,
      'userExposed'
    )

    configManager.trackingManager = trackingManager
  })

  // it('test userExposed failed', async () => {
  //   try {
  //     const error = 'Error'
  //     activateFlag.mockRejectedValue(error)
  //     await defaultStrategy.userExposed({ key: returnMod.key, flag: returnMod, defaultValue: returnMod.value })
  //     expect(logError).toBeCalledTimes(1)
  //     expect(logError).toBeCalledWith(error, 'userExposed')
  //     expect(activateFlag).toBeCalledTimes(1)
  //   } catch (error) {
  //     console.log('error', error)
  //   }
  // })

  it('test getAllModifications', async () => {
    const campaigns = await defaultStrategy.getAllModifications()
    expect(campaigns).toEqual({
      visitorId: visitorDelegate.visitorId,
      campaigns: campaignDTO
    })
  })

  it('test getAllModifications with activate', async () => {
    const campaigns = await defaultStrategy.getAllModifications(true)
    expect(campaigns).toEqual({
      visitorId: visitorDelegate.visitorId,
      campaigns: campaignDTO
    })
    expect(activateFlag).toBeCalledTimes(8)
  })

  it('test getModificationsForCampaign', async () => {
    const campaigns = await defaultStrategy.getModificationsForCampaign(campaignDtoId)
    expect(campaigns).toEqual({
      visitorId: visitorDelegate.visitorId,
      campaigns: campaignDTO
    })
    expect(activateFlag).toBeCalledTimes(0)
  })

  it('test getModificationsForCampaign with activate', async () => {
    const campaigns = await defaultStrategy.getModificationsForCampaign(campaignDtoId, true)
    expect(campaigns).toEqual({
      visitorId: visitorDelegate.visitorId,
      campaigns: campaignDTO
    })
    expect(activateFlag).toBeCalledTimes(1)
  })

  const hitScreen = new Screen({ documentLocation: 'home', visitorId })

  it('test sendHit', async () => {
    await defaultStrategy.sendHit(hitScreen)
    expect(addHit).toBeCalledTimes(1)
    expect(addHit).toBeCalledWith(hitScreen)
    expect(sendTroubleshootingHit).toBeCalledTimes(1)
    const label: TroubleshootingLabel = 'VISITOR-SEND-HIT'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  it('test hasTrackingManager sendHit', async () => {
    configManager.trackingManager = getNull()
    await defaultStrategy.sendHit(hitScreen)

    expect(addHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      TRACKER_MANAGER_MISSING_ERROR,
      PROCESS_SEND_HIT
    )

    configManager.trackingManager = trackingManager
  })

  it('test hasTrackingManager sendHits', async () => {
    configManager.trackingManager = getNull()
    await defaultStrategy.sendHits([hitScreen])

    expect(addHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(
      TRACKER_MANAGER_MISSING_ERROR,
      PROCESS_SEND_HIT
    )
    configManager.trackingManager = trackingManager
  })

  it('test sendHitAsync', async () => {
    try {
      await defaultStrategy.sendHit(hitScreen)
      expect(addHit).toBeCalledTimes(1)
      expect(addHit).toBeCalledWith(hitScreen)
    } catch (error) {
      expect(logError).toBeCalled()
    }
  })

  it('test sendHitAsync with literal object Event ', async () => {
    try {
      const hit = {
        type: HitType.EVENT,
        action: 'action_1',
        category: EventCategory.ACTION_TRACKING
      }
      await defaultStrategy.sendHit(hit)
      expect(addHit).toBeCalledTimes(1)
      expect(addHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config }))
    } catch (error) {
      console.log(error)
      expect(logError).toBeCalled()
    }
  })

  it('test sendHitAsync with literal object ITEM ', async () => {
    try {
      const hit = {
        type: HitType.ITEM,
        transactionId: 'transaction_id_1',
        productName: 'name',
        productSku: '0014'
      }
      await defaultStrategy.sendHit(hit)
      expect(addHit).toBeCalledTimes(1)
      expect(addHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config }))
    } catch (error) {
      console.log(error)
      expect(logError).toBeCalled()
    }
  })

  it('test sendHitAsync with literal object PAGE ', async () => {
    const hit = {
      type: HitType.PAGE_VIEW,
      documentLocation: 'home'
    }
    try {
      await defaultStrategy.sendHit(hit)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(addHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config }))
    expect(addHit).toBeCalledTimes(1)
  })

  it('test sendHitAsync with literal object PAGE ', async () => {
    const hit = {
      type: 'PAGEVIEW' as HitType,
      documentLocation: 'home'
    }

    try {
      await defaultStrategy.sendHit(hit)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(addHit).toBeCalledWith(expect.objectContaining({ ...hit, type: HitType.PAGE_VIEW, visitorId, ds: SDK_APP, config }))
    expect(addHit).toBeCalledTimes(1)
  })

  it('test sendHitAsync with literal object SCREEN ', async () => {
    const hit = {
      type: HitType.SCREEN_VIEW,
      documentLocation: 'home'
    }
    try {
      await defaultStrategy.sendHit(hit)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(addHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config }))
    expect(addHit).toBeCalledTimes(1)
  })

  it('test sendHitAsync with literal object PAGE ', async () => {
    const hit = {
      type: 'SCREENVIEW' as HitType,
      documentLocation: 'home'
    }

    try {
      await defaultStrategy.sendHit(hit)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(addHit).toBeCalledWith(expect.objectContaining({ ...hit, type: HitType.SCREEN_VIEW, visitorId, ds: SDK_APP, config }))
    expect(addHit).toBeCalledTimes(1)
  })

  it('test sendHitAsync with literal object TRANSACTION ', async () => {
    const hit = {
      type: HitType.TRANSACTION,
      transactionId: 'transactionId',
      affiliation: 'affiliation'
    }
    try {
      await defaultStrategy.sendHit(hit)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    expect(addHit).toBeCalledWith(expect.objectContaining({ ...hit, visitorId, ds: SDK_APP, config }))
    expect(addHit).toBeCalledTimes(1)
  })

  it('test sendHitAsync with literal object TRANSACTION ', async () => {
    const hits = [{
      type: HitType.TRANSACTION,
      transactionId: 'transactionId',
      affiliation: 'affiliation'
    },
    {
      type: HitType.TRANSACTION,
      transactionId: 'transactionId_2',
      affiliation: 'affiliation_2'
    }]
    try {
      await defaultStrategy.sendHits(hits)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    // await sleep(4000)
    expect(addHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ ...hits[0], visitorId, ds: SDK_APP, config }))
    expect(addHit).toHaveBeenNthCalledWith(2, expect.objectContaining({ ...hits[1], visitorId, ds: SDK_APP, config }))
    expect(addHit).toBeCalledTimes(2)
  })

  it('test sendHitAsync with literal legacy object TRANSACTION ', async () => {
    const hit1: HitShape = {
      type: 'Transaction',
      data: {
        transactionId: 'transactionId',
        affiliation: 'affiliation'
      }
    }
    const hit2: HitShape = {
      type: 'Transaction',
      data: {
        transactionId: 'transactionId_2',
        affiliation: 'affiliation_2'
      }
    }
    const hits: HitShape[] = [hit1, hit2]
    try {
      await defaultStrategy.sendHits(hits)
    } catch (error) {
      expect(logError).toBeCalled()
    }
    // await sleep(4000)
    expect(addHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ _transactionId: hit1.data.transactionId, _affiliation: hit1.data.affiliation, visitorId, ds: SDK_APP, config }))
    expect(addHit).toHaveBeenNthCalledWith(2, expect.objectContaining({ _transactionId: hit2.data.transactionId, _affiliation: hit2.data.affiliation, visitorId, ds: SDK_APP, config }))
    expect(addHit).toBeCalledTimes(2)
  })

  it('test sendHitAsync with literal legacy object EVENT', async () => {
    addHit.mockResolvedValue()
    const hit1: HitShape = {
      type: 'Event',
      data: {
        category: 'Action Tracking',
        action: 'action',
        label: 'label',
        value: 1
      }
    }
    const hit2: HitShape = {
      type: 'Page',
      data: {
        documentLocation: 'http://localhost',
        pageTitle: 'title'
      }
    }
    const hit3: HitShape = {
      type: 'Screen',
      data: {
        documentLocation: 'home',
        pageTitle: 'title'
      }
    }
    const hit4: HitShape = {
      type: 'Item',
      data: {
        transactionId: 'transactionId',
        name: 'name',
        code: 'code'
      }
    }

    const hit6 = {
      type: 'NOT_EXISTS',
      data: {
        transactionId: 'transactionId',
        name: 'name',
        code: 'code'
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hits: HitShape[] = [hit1, hit2, hit3, hit4, hit6 as any]
    await defaultStrategy.sendHits(hits)
    expect(logError).toBeCalledTimes(1)
    expect(addHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ _action: hit1.data.action, _category: hit1.data.category, _label: hit1.data.label, visitorId, ds: SDK_APP, config }))
    expect(addHit).toHaveBeenNthCalledWith(2, expect.objectContaining({ documentLocation: hit2.data.documentLocation, visitorId, ds: SDK_APP, config }))
    expect(addHit).toHaveBeenNthCalledWith(3, expect.objectContaining({ documentLocation: hit3.data.documentLocation, visitorId, ds: SDK_APP, config }))
    expect(addHit).toHaveBeenNthCalledWith(4, expect.objectContaining({ transactionId: hit4.data.transactionId, productName: hit4.data.name, productSku: hit4.data.code, visitorId, ds: SDK_APP, config }))
    expect(addHit).toBeCalledTimes(4)
  })

  it('test sendHitAsync with literal object type NotEXIST ', async () => {
    const hit = {
      type: 'NOT_EXIST' as HitType,
      transactionId: 'transactionId',
      affiliation: 'affiliation'
    }

    await defaultStrategy.sendHit(hit)

    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(TYPE_HIT_REQUIRED_ERROR, PROCESS_SEND_HIT)
    expect(addHit).toBeCalledTimes(0)
  })

  it('test sendHit failed', async () => {
    try {
      const error = 'Error'
      addHit.mockRejectedValue(error)
      await defaultStrategy.sendHit(hitScreen)
      expect(addHit).toBeCalledTimes(1)
      expect(addHit).toBeCalledWith(hitScreen)
    } catch (error) {
      expect(logError).toBeCalledTimes(1)
      expect(logError).toBeCalledWith(error, PROCESS_SEND_HIT)
    }
  })

  it('test sendHitAsync with is ready method to false', async () => {
    addHit.mockResolvedValue()
    const hits = [{
      type: HitType.TRANSACTION,
      transactionId: '',
      affiliation: ''
    },
    {
      type: HitType.TRANSACTION,
      transactionId: 'transactionId_2',
      affiliation: 'affiliation_2'
    }]
    await defaultStrategy.sendHits(hits)

    expect(addHit).toBeCalledTimes(1)
    expect(addHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ ...hits[1], visitorId, ds: SDK_APP, config }))
    expect(logError).toBeCalledTimes(1)
  })

  it('test sendHitAsync with is ready method to false', async () => {
    await defaultStrategy.sendHit(getNull())
    expect(addHit).toBeCalledTimes(0)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(HIT_NULL_ERROR, PROCESS_SEND_HIT)
  })

  it('test unauthenticate with null anonymousId', () => {
    defaultStrategy.unauthenticate()
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBe(null)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(FLAGSHIP_VISITOR_NOT_AUTHENTICATE, visitorId), UNAUTHENTICATE)
  })

  it('test authenticate with null visitorId', () => {
    defaultStrategy.authenticate(getNull())
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBeNull()
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(VISITOR_AUTHENTICATE_VISITOR_ID_ERROR, visitorId), AUTHENTICATE)
  })

  const authenticateId = 'authenticateId'
  it('test authenticate', () => {
    defaultStrategy.authenticate(authenticateId)
    expect(visitorDelegate.visitorId).toBe(authenticateId)
    expect(visitorDelegate.anonymousId).toBe(visitorId)
    expect(sendTroubleshootingHit).toBeCalledTimes(1)
    const label: TroubleshootingLabel = 'VISITOR-AUTHENTICATE'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
    expect(visitorDelegate.flagSynchStatus).toBe(FlagSynchStatus.AUTHENTICATED)
  })

  it('test unauthenticate', () => {
    defaultStrategy.unauthenticate()
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBeNull()
    expect(visitorDelegate.flagSynchStatus).toBe(FlagSynchStatus.UNAUTHENTICATED)
    expect(sendTroubleshootingHit).toBeCalledTimes(1)
    const label: TroubleshootingLabel = 'VISITOR-UNAUTHENTICATE'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })

  it('test updateCampaigns', () => {
    const modifications = new Map<string, FlagDTO>([['key', { key: '', campaignId: '', variationGroupId: '', variationId: '', isReference: false, value: '' }]])
    getModifications.mockReturnValue(modifications)
    const campaigns = [{
      id: 'c2nrh1hjg50l9thhu8bg',
      variationGroupId: 'c2nrh1hjg50l9thhu8cg',
      variation: {
        id: 'c2nrh1hjg50l9thhu8dg',
        modifications: {
          type: 'JSON',
          value: {
            key: 'value'
          }
        },
        reference: false
      }
    }]
    defaultStrategy.updateCampaigns(campaigns)
    expect(visitorDelegate.campaigns).toEqual(campaigns)
    expect(visitorDelegate.flagsData).toEqual(modifications)
  })

  it('test updateCampaigns throw error', () => {
    const error = 'error'
    getModifications.mockImplementation(() => {
      throw error
    })
    const campaigns = [{
      id: 'c2nrh1hjg50l9thhu8bg',
      variationGroupId: 'c2nrh1hjg50l9thhu8cg',
      variation: {
        id: 'c2nrh1hjg50l9thhu8dg',
        modifications: {
          type: 'JSON',
          value: {
            key: 'value'
          }
        },
        reference: false
      }
    }]
    defaultStrategy.updateCampaigns(campaigns)
    expect(logError).toBeCalledTimes(1)
  })
})

describe('test DefaultStrategy ', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0, fetchFlagsBufferingTime: 0 })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const getModifications = jest.spyOn(
    apiManager,
    'getModifications'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')
  activateFlag.mockResolvedValue()

  const configManager = new ConfigManager(config, apiManager, trackingManager)
  const murmurHash = new MurmurHash()
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager })
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  const campaignDtoId = 'c2nrh1hjg50l9stringgu8bg'
  const campaignDTO = [
    {
      id: campaignDtoId,
      slug: 'slug',
      variationGroupId: 'id',
      variation: {
        id: '1dl',
        reference: false,
        modifications: {
          type: 'number',
          value: 12
        }
      }
    }
  ]

  it('test synchronizeModifications', async () => {
    try {
      visitorDelegate.on('ready', (err) => {
        expect(err).toBeUndefined()
      })
      getCampaignsAsync.mockResolvedValue(campaignDTO)
      getModifications.mockReturnValue(returnModification)
      await defaultStrategy.synchronizeModifications()
      expect(getCampaignsAsync).toBeCalledTimes(1)
      expect(getCampaignsAsync).toBeCalledWith(visitorDelegate)
      expect(getModifications).toBeCalledTimes(1)
      expect(getModifications).toBeCalledWith(campaignDTO)
    } catch (error) {
      expect(logError).toBeCalled()
    }
  })
})

describe('test DefaultStrategy fetch flags buffering', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logInfo = jest.spyOn(logManager, 'info')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0 })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const getModifications = jest.spyOn(
    apiManager,
    'getModifications'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')
  activateFlag.mockResolvedValue()

  const configManager = new ConfigManager(config, apiManager, trackingManager)
  const murmurHash = new MurmurHash()
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager })
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  const campaignDtoId = 'c2nrh1hjg50l9stringgu8bg'
  const campaignDTO = [
    {
      id: campaignDtoId,
      slug: 'slug',
      variationGroupId: 'id',
      variation: {
        id: '1dl',
        reference: false,
        modifications: {
          type: 'number',
          value: 12
        }
      }
    }
  ]

  it('test fetchFlags', async () => {
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeUndefined()
    })
    getCampaignsAsync.mockResolvedValue(campaignDTO)
    getModifications.mockReturnValue(returnModification)
    await defaultStrategy.fetchFlags()
    await defaultStrategy.fetchFlags()
    expect(getCampaignsAsync).toBeCalledTimes(1)
    expect(getCampaignsAsync).toBeCalledWith(visitorDelegate)
    expect(getModifications).toBeCalledTimes(1)
    expect(getModifications).toBeCalledWith(campaignDTO)
    expect(logInfo).toBeCalledTimes(1)

    visitorDelegate.updateContext('key', 'value1')
    await defaultStrategy.fetchFlags()
    expect(getCampaignsAsync).toBeCalledTimes(2)
  })

  it('test fetchFlags', async () => {
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeUndefined()
    })
    getCampaignsAsync.mockResolvedValue(campaignDTO)
    getModifications.mockReturnValue(returnModification)
    config.fetchFlagsBufferingTime = -1
    await defaultStrategy.fetchFlags()
    await defaultStrategy.fetchFlags()
    expect(getCampaignsAsync).toBeCalledTimes(2)
    expect(getCampaignsAsync).toBeCalledWith(visitorDelegate)
    expect(getModifications).toBeCalledTimes(2)
    expect(getModifications).toBeCalledWith(campaignDTO)
    expect(logInfo).toBeCalledTimes(0)
  })

  it('test fetchFlags', async () => {
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeUndefined()
    })
    getCampaignsAsync.mockResolvedValue(campaignDTO)
    getModifications.mockReturnValue(returnModification)
    config.fetchFlagsBufferingTime = 0
    await defaultStrategy.fetchFlags()
    await defaultStrategy.fetchFlags()
    expect(getCampaignsAsync).toBeCalledTimes(2)
    expect(getCampaignsAsync).toBeCalledWith(visitorDelegate)
    expect(getModifications).toBeCalledTimes(2)
    expect(getModifications).toBeCalledWith(campaignDTO)
    expect(logInfo).toBeCalledTimes(0)
  })
})

describe('test authenticate on bucketing mode', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new BucketingConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const trackingManager = new TrackingManager({} as HttpClient, config)

  const configManager = new ConfigManager(config, {} as ApiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager })
  const murmurHash = new MurmurHash()
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  it('test authenticate on bucketing mode', () => {
    const authenticateId = 'authenticateId'
    defaultStrategy.authenticate(authenticateId)
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBe(null)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_BUCKETING_ERROR, visitorId, AUTHENTICATE), AUTHENTICATE)
  })

  it('test unauthenticate on bucketing mode', () => {
    defaultStrategy.unauthenticate()
    expect(visitorDelegate.visitorId).toBe(visitorId)
    expect(visitorDelegate.anonymousId).toBe(null)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith(sprintf(METHOD_DEACTIVATED_BUCKETING_ERROR, visitorId, UNAUTHENTICATE), UNAUTHENTICATE)
  })
})

describe('test fetchFlags errors', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {}

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager })

  const murmurHash = new MurmurHash()

  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  it('test fetchFlags error', async () => {
    const error = new Error('message 1')
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeDefined()
      expect(err.message).toEqual(error.message)
    })

    getCampaignsAsync.mockRejectedValue(error)

    await defaultStrategy.fetchFlags()
    expect(logError).toBeCalled()
    expect(logError).toBeCalledWith(error.message, PROCESS_FETCHING_FLAGS)
  })
})

describe('test fetchFlags errors 2', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {}

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const getModifications = jest.spyOn(
    apiManager,
    'getModifications'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager })

  const murmurHash = new MurmurHash()

  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  it('test fetchFlags error 2', async () => {
    const error = new Error('message 2')
    visitorDelegate.on('ready', (err) => {
      expect(err).toBeDefined()
      expect(err.message).toEqual(error.message)
    })

    getCampaignsAsync.mockResolvedValue([])
    getModifications.mockImplementation(() => {
      throw error
    })

    await defaultStrategy.fetchFlags()
    expect(logError).toBeCalled()
    expect(logError).toBeCalledWith(errorFormat(error.message, {
      visitorId,
      anonymousId: visitorDelegate.anonymousId,
      context: visitorDelegate.context,
      isFromCache: false,
      duration: 0
    }), PROCESS_FETCHING_FLAGS)
  })
})

describe('test DefaultStrategy troubleshootingHit', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0 })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const getModifications = jest.spyOn(
    apiManager,
    'getModifications'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit')

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')
  activateFlag.mockResolvedValue()

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const murmurHash = new MurmurHash()
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager })
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  it('test fetchFlags', async () => {
    const flagDTO: FlagDTO = {
      key: 'key',
      campaignId: 'campaignId',
      variationGroupId: 'variationGroupId',
      variationId: 'variationId',
      value: 'value'
    }
    const flags = new Map<string, FlagDTO>().set(flagDTO.key, flagDTO)
    getCampaignsAsync.mockResolvedValue([])
    getModifications.mockReturnValueOnce(flags)
    await defaultStrategy.fetchFlags()
    expect(sendTroubleshootingHit).toBeCalledTimes(1)

    const label: TroubleshootingLabel = 'VISITOR-FETCH-CAMPAIGNS'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))

    defaultStrategy.setConsent(true)
    const label1: TroubleshootingLabel = 'VISITOR-SEND-HIT'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(2, expect.objectContaining({ label: label1 }))
  })
})

describe('test DefaultStrategy troubleshootingHit Bucketing mode', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const bucketing = {
    campaigns: [
      {
        id: 'c1ndsu87m030114t8uu0',
        type: 'toggle',
        slug: 'campaign_1',
        variationGroups: [
          {
            id: 'c1ndsu87m030114t8uv0',
            targeting: {
              targetingGroups: [
                {
                  targetings: [
                    {
                      operator: 'EQUALS',
                      key: 'fs_users',
                      value: 'visitor_1'
                    }
                  ]
                }
              ]
            },
            variations: [
              {
                id: 'c1ndsu87m030114t8uvg',
                modifications: {
                  type: 'FLAG',
                  value: {
                    background: 'bleu ciel',
                    btnColor: '#EE3300',
                    keyBoolean: false,
                    keyNumber: 5660
                  }
                },
                allocation: 100
              }
            ]
          }
        ]
      }]
  }

  const config = new BucketingConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0, initialBucketing: bucketing })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)
  const murmurHash = new MurmurHash()

  const decisionManager = new BucketingManager(httpClient, config, murmurHash)

  const getModifications = jest.spyOn(
    decisionManager,
    'getModifications'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit')

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')
  activateFlag.mockResolvedValue()

  const configManager = new ConfigManager(config, decisionManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager })
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStrategy = jest.spyOn((visitorDelegate as any), 'getStrategy')
  getStrategy.mockReturnValue(defaultStrategy)

  it('test fetchFlags', async () => {
    const flagDTO: FlagDTO = {
      key: 'key',
      campaignId: 'campaignId',
      variationGroupId: 'variationGroupId',
      variationId: 'variationId',
      value: 'value'
    }
    const flags = new Map<string, FlagDTO>().set(flagDTO.key, flagDTO)
    // getCampaignsAsync.mockResolvedValue([])
    getModifications.mockReturnValueOnce(flags)
    await defaultStrategy.fetchFlags()
    expect(sendTroubleshootingHit).toBeCalledTimes(2)

    let label: TroubleshootingLabel = 'VISITOR-SEND-HIT'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))

    label = 'VISITOR-FETCH-CAMPAIGNS'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(2, expect.objectContaining({ label }))
  })
})

describe('test DefaultStrategy troubleshootingHit', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0 })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  const getModifications = jest.spyOn(
    apiManager,
    'getModifications'
  )

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit')

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')
  activateFlag.mockResolvedValue()

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const murmurHash = new MurmurHash()
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager })
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })
  const campaignDtoId = 'c2nrh1hjg50l9stringgu8bg'
  const campaignDTO = [
    {
      id: campaignDtoId,
      slug: 'slug',
      variationGroupId: 'id',
      variation: {
        id: '1dl',
        reference: false,
        modifications: {
          type: 'number',
          value: 12
        }
      }
    }
  ]
  it('test fetchFlags throw error here ', async () => {
    getCampaignsAsync.mockResolvedValue(campaignDTO)
    getModifications.mockImplementation(() => {
      throw new Error('error')
    })
    await defaultStrategy.fetchFlags()
    expect(sendTroubleshootingHit).toBeCalledTimes(1)
    const label: TroubleshootingLabel = 'VISITOR-FETCH-CAMPAIGNS-ERROR'
    expect(sendTroubleshootingHit).toHaveBeenNthCalledWith(1, expect.objectContaining({ label }))
  })
})

describe('test DefaultStrategy troubleshootingHit visitor traffic === undefined', () => {
  const methodNow = Date.now
  const mockNow = jest.fn<typeof Date.now>()
  beforeAll(() => {
    Date.now = mockNow
    mockNow.mockReturnValue(1)
  })
  afterAll(() => {
    Date.now = methodNow
  })
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey', hitDeduplicationTime: 0 })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post = jest.fn<typeof httpClient.postAsync>()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const trackingManager = new TrackingManager(httpClient, config)

  const addHit = jest.spyOn(trackingManager, 'addHit')
  addHit.mockResolvedValue()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendTroubleshootingHit = jest.spyOn(trackingManager, 'sendTroubleshootingHit')

  const activateFlag = jest.spyOn(trackingManager, 'activateFlag')
  activateFlag.mockResolvedValue()

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const murmurHash = new MurmurHash()
  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager })
  const defaultStrategy = new DefaultStrategy({ visitor: visitorDelegate, murmurHash })

  it('test fetchFlags', async () => {
    await defaultStrategy.sendHit({
      type: HitType.PAGE,
      documentLocation: 'localhost'
    })
    expect(sendTroubleshootingHit).toBeCalledTimes(0)
  })
})
