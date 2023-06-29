import { jest } from '@jest/globals'
import { BucketingDTO, CampaignDTO, DecisionMode, FlagDTO, FlagMetadata, FlagshipStatus, IFlag, IFlagshipLogManager, IHitCacheImplementation, IVisitorCacheImplementation, LogLevel, NewVisitor, OnVisitorExposed, UserExposureInfo, primitive } from '..'
import { IFlagshipConfig, ITrackingManagerConfig } from '../config'
import { uuidV4 } from '../utils/utils'
import { EMIT_READY } from '../enum/FlagshipConstant'
import { IHit } from '../types'
import { Mock } from 'jest-mock'

type ConfigMock = {
  envId?: string
  apiKey?: string
  timeout?: number;
  logLevel?: LogLevel;
  decisionMode?: DecisionMode
  statusChangedCallback?: Mock<(status: FlagshipStatus) => void>;
  logManager?: IFlagshipLogManager;
  fetchNow?: boolean,
  pollingInterval?: number
  fetchThirdPartyData?: boolean
  enableClientCache?: boolean
  onBucketingSuccess?: Mock<(param: { status: number; payload: BucketingDTO }) => void>
  onBucketingFail?: Mock<(error: Error) => void>
  onBucketingUpdated?: Mock<(lastUpdate: Date) => void>
  initialBucketing?: BucketingDTO
  decisionApiUrl?: string
  hitDeduplicationTime?: number
  visitorCacheImplementation?: IVisitorCacheImplementation
  hitCacheImplementation?: IHitCacheImplementation
  disableCache?: boolean
  trackingMangerConfig?: ITrackingManagerConfig
  onUserExposure?: Mock<(param: UserExposureInfo)=>void>
  onVisitorExposed?: Mock<(arg: OnVisitorExposed)=> void>
  onLog?: Mock<(level: LogLevel, tag: string, message: string)=>void>
  nextFetchConfig?: Record<string, unknown>
}

type visitorMock = {
  on: Mock<(eventName: string, listener: (...args: any[]) => void) => visitorMock>
  visitorId: string;
  anonymousId: string | null;
  flagsData: Map<string, FlagDTO>;
  context: Record<string, primitive>;
  config: IFlagshipConfig;
  getModificationsArray: Mock<()=> FlagDTO[]>,
  getFlagsDataArray: Mock<()=> FlagDTO[]>,
  hasConsented: true,
  setConsent: Mock<(hasConsented: boolean)=> void>,
  updateContext: Mock<(context: Record<string, primitive> | string, value?:primitive)=> void>,
  clearContext: Mock<()=> void>,
  getFlag: Mock<typeof _getFlag>,
  fetchFlags: Mock<()=> Promise<void>>,
  sendHit: Mock<(hit: IHit)=> Promise<void>>,
  sendHits: Mock<(hit: IHit[])=> Promise<void>>,
  getAllFlagsData: Mock<(activate: boolean)=> Promise<{ visitorId: string; campaigns: CampaignDTO[] }>>,
  getFlatsDataForCampaign: Mock<(campaignId: string, activate: boolean)=> Promise<{ visitorId: string; campaigns: CampaignDTO[] }>>,
  authenticate: Mock<(visitorId: string)=> void>,
  unauthenticate: Mock<()=> void>

}

type FlagshipMock = {
  start: Mock<(envId: string, apiKey: string, config?: ConfigMock) => FlagshipMock>;
  newVisitor: Mock<(arg?: NewVisitor) => visitorMock>;
  getStatus: Mock<() => FlagshipStatus>;
  getConfig: Mock<() => IFlagshipConfig>;
  getVisitor: Mock<() => visitorMock>
  close: Mock<() => Promise<void>>
  throwErrorFetchFlags?: Error;
}

let SDKConfig:ConfigMock = {
  envId: '',
  apiKey: '',
  statusChangedCallback: jest.fn<(status: FlagshipStatus) => void>(),
  fetchNow: true
}

let SDKFsVisitor:visitorMock = {
  on: jest.fn(visitorEventOn),
  visitorId: '',
  anonymousId: '',
  flagsData: new Map<string, FlagDTO>(),
  context: {},
  config: SDKConfig,
  getModificationsArray: jest.fn<()=> FlagDTO[]>(),
  getFlagsDataArray: jest.fn<()=> FlagDTO[]>(),
  hasConsented: true,
  setConsent: jest.fn<(hasConsented: boolean)=> void>(),
  updateContext: jest.fn<(context: Record<string, primitive> | string, value?:primitive)=> void>(),
  clearContext: jest.fn<()=> void>(),
  getFlag: jest.fn(_getFlag),
  fetchFlags: jest.fn<()=> Promise<void>>(_fetchFlags),
  sendHit: jest.fn<(hit: IHit)=> Promise<void>>(),
  sendHits: jest.fn<(hit: IHit[])=> Promise<void>>(),
  getAllFlagsData: jest.fn<(activate: boolean)=> Promise<{ visitorId: string; campaigns: CampaignDTO[] }>>(),
  getFlatsDataForCampaign: jest.fn<(campaignId: string, activate: boolean)=> Promise<{ visitorId: string; campaigns: CampaignDTO[] }>>(),
  authenticate: jest.fn<(visitorId: string)=> void>(_authenticate),
  unauthenticate: jest.fn<()=> void>(_unauthenticate)
}

let visitorEventOnReadyListener:(...args: any[]) => void

export const Flagship:FlagshipMock = {
  start: jest.fn(_start),
  newVisitor: jest.fn(_newVisitor),
  getStatus: jest.fn(_getStatus),
  getConfig: jest.fn(_getConfig),
  getVisitor: jest.fn(_getVisitor),
  close: jest.fn<()=> Promise<void>>()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function visitorEventOn (eventName: string, listener: (...args: any[]) => void):visitorMock {
  if (eventName === EMIT_READY) {
    visitorEventOnReadyListener = listener
  }
  return SDKFsVisitor
}

function _start (envId: string, apiKey: string, config?: ConfigMock): typeof Flagship {
  SDKConfig = { ...SDKConfig, ...config }
  if (!envId || !apiKey) {
    if (SDKConfig.statusChangedCallback) {
      SDKConfig.statusChangedCallback(FlagshipStatus.NOT_INITIALIZED)
    }
    return Flagship
  }
  if (SDKConfig.statusChangedCallback) {
    SDKConfig.statusChangedCallback(FlagshipStatus.STARTING)
  }
  SDKConfig.envId = envId
  SDKConfig.apiKey = apiKey
  if (SDKConfig.statusChangedCallback) {
    SDKConfig.statusChangedCallback(FlagshipStatus.READY)
  }
  return Flagship
}

function _newVisitor (arg?: NewVisitor):visitorMock {
  SDKFsVisitor = {
    ...SDKFsVisitor,
    visitorId: arg?.visitorId || uuidV4(),
    anonymousId: arg?.isAuthenticated ? uuidV4() : null,
    flagsData: new Map<string, FlagDTO>(),
    context: arg?.context || {},
    config: SDKConfig,
    getModificationsArray: jest.fn<()=> FlagDTO[]>(),
    getFlagsDataArray: jest.fn<()=> FlagDTO[]>(),
    hasConsented: arg?.hasConsented || true,
    setConsent: jest.fn<(hasConsented: boolean)=> void>(),
    updateContext: jest.fn<(context: Record<string, primitive> | string, value?:primitive)=> void>(),
    clearContext: jest.fn<()=> void>(),
    getFlag: jest.fn(_getFlag),
    fetchFlags: jest.fn<()=> Promise<void>>(_fetchFlags),
    sendHit: jest.fn<(hit: IHit)=> Promise<void>>(),
    sendHits: jest.fn<(hit: IHit[])=> Promise<void>>(),
    getAllFlagsData: jest.fn<(activate: boolean)=> Promise<{ visitorId: string; campaigns: CampaignDTO[] }>>(),
    getFlatsDataForCampaign: jest.fn<(campaignId: string, activate: boolean)=> Promise<{ visitorId: string; campaigns: CampaignDTO[] }>>(),
    authenticate: jest.fn<(visitorId: string)=> void>(_authenticate),
    unauthenticate: jest.fn<()=> void>(_unauthenticate)
  }
  if (SDKConfig.fetchNow) {
    SDKFsVisitor.fetchFlags()
  }

  return SDKFsVisitor
}

function _getVisitor () {
  return SDKFsVisitor
}

function _getConfig ():IFlagshipConfig {
  return SDKConfig
}

function _getStatus () {
  return FlagshipStatus.READY
}

function _getFlag <T> (key:string, defaultValue:T):IFlag<T> {
  return {
    getValue: jest.fn<(visitorExposed?:boolean)=>T>(),
    visitorExposed: jest.fn<()=>Promise<void>>(),
    userExposed: jest.fn<()=>Promise<void>>(),
    metadata: FlagMetadata.Empty(),
    exists: jest.fn<()=>boolean>()
  }
}

async function _fetchFlags ():Promise<void> {
  setTimeout(() => {
    if (Flagship.throwErrorFetchFlags) {
      visitorEventOnReadyListener(Flagship.throwErrorFetchFlags.message || Flagship.throwErrorFetchFlags)
      throw Flagship.throwErrorFetchFlags
    }
    if (visitorEventOnReadyListener) {
      visitorEventOnReadyListener(null)
    }
  }, 1)
}

function _authenticate (visitorId: string):void {
  SDKFsVisitor.anonymousId = SDKFsVisitor.visitorId
  SDKFsVisitor.visitorId = visitorId
}

function _unauthenticate () {
  SDKFsVisitor.visitorId = SDKFsVisitor.anonymousId || ''
}

export type { IFlagshipConfig } from '../config/index'
export type { IEvent, IItem, IPage, IScreen, ITransaction } from '../hit/index'
export { Event, EventCategory, Item, Page, Screen, Transaction, HitAbstract } from '../hit/index'
export { FlagshipStatus, LogLevel, HitType, CacheStrategy } from '../enum/index'
export * from '../enum/FlagshipContext'
export * from '../types'
export { DecisionApiConfig, DecisionMode } from '../config/index'
