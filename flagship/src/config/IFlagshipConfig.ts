import { IHitCacheImplementation } from '../cache/IHitCacheImplementation'
import { IVisitorCacheImplementation } from '../cache/IVisitorCacheImplementation'
import { BucketingDTO } from '../decision/api/bucketingDTO'
import { FlagshipStatus } from '../enum/index'
import { LogLevel } from '../enum/LogLevel'
import { OnVisitorExposed, UserExposureInfo } from '../types'
import { IFlagshipLogManager } from '../utils/FlagshipLogManager'
import { DecisionMode } from './DecisionMode'
import { ITrackingManagerConfig } from './TrackingManagerConfig'

export interface IFlagshipConfig {
    /**
     * Specify the environment id provided by Flagship, to use.
     */
    envId?: string

    /**
     * Specify the secure api key provided by Flagship, to use.
     */
    apiKey?: string

    /**
     * Specify timeout in seconds for api request.
     * Default is 2s.
     */
    timeout?: number;

    /**
     * Set the maximum log level to display
     */
    logLevel?: LogLevel;

    /**
     * Specify the SDK running mode.
     * BUCKETING or DECISION_API
     */
    decisionMode?: DecisionMode

    /**
     * Define a callable in order to get callback when the SDK status has changed.
     */
    statusChangedCallback?: (status: FlagshipStatus) => void;

    /** Specify a custom implementation of LogManager in order to receive logs from the SDK. */
    logManager?: IFlagshipLogManager;

    /**
     * Decide to fetch automatically modifications data when creating a new FlagshipVisitor
     */
    fetchNow?: boolean,

    /**
     * Specify delay between two bucketing polling. Default is 2s.
     *
     * Note: If 0 is given then it should poll only once at start time.
     */
    pollingInterval?: number

    fetchThirdPartyData?: boolean

    /**
     * Indicates whether enables or disables the client cache manager.
     * By enabling the client cache, it will allow you to keep cross sessions visitor experience.
     */
    enableClientCache?: boolean

    /**
     * Define a callable in order to get callback when the first bucketing polling succeed.
     */
    onBucketingSuccess?: (param: { status: number; payload: BucketingDTO }) => void

    /**
     * Define a callable to get callback when the first bucketing polling failed.
     */
    onBucketingFail?: (error: Error) => void

    /**
     * Define a callable to get callback each time bucketing data from Flagship has updated.
     */
    onBucketingUpdated?: (lastUpdate: Date) => void

    /**
     * This is a set of flag data provided to avoid the SDK to have an empty cache during the first initialization.
     */
    initialBucketing?: BucketingDTO

    decisionApiUrl?: string

    /**
     * Specify delay in seconds of hit deduplication. After a hit is sent, all future sending of this hit will be blocked until the expiration of the delay.
     *
     * Note: if 0 is given, no deduplication process will be used
     */
    hitDeduplicationTime?: number

    /**
     * Define an object that implement the interface visitorCacheImplementation, to handle the visitor cache.
     *
     */
    visitorCacheImplementation?: IVisitorCacheImplementation

    /**
     * Define an object that implement the interface IHitCacheImplementation, to handle the visitor cache.
     */
    hitCacheImplementation?: IHitCacheImplementation

    /**
     * If it's set to true, hit cache and visitor cache will be disabled otherwise will be enabled.
     */
    disableCache?: boolean

    language?: 0 | 1 | 2

    /**
     * Define options to configure hit batching
     */
    trackingMangerConfig?: ITrackingManagerConfig

    /**
     * Define a callable to get callback each time  a Flag have been user exposed (activation hit has been sent) by SDK
     * @deprecated Use **onVisitorExposed** instead
     */
    onUserExposure?: (param: UserExposureInfo)=>void
    /**
     *
     * @param arg
     * @returns
     */
    onVisitorExposed?:(arg: OnVisitorExposed)=> void
    sdkVersion?: string
    /**
     * Define a callable to get a callback whenever the SDK needs to report a log
     */
    onLog?: (level: LogLevel, tag: string, message: string)=>void
    nextFetchConfig?: Record<string, unknown>
  }
