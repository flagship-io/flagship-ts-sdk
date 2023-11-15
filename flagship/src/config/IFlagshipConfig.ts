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

    /**
     * Bucketing mode only
     *
     * If true, will fetch the visitor's segment from universal data connector each time fetchFlags is called and append those segments in the visitor context
     */
    fetchThirdPartyData?: boolean

    /**
     * Indicates whether enables or disables the client cache manager.
     * By enabling the client cache, it will allow you to keep cross sessions visitor experience.
     */
    enableClientCache?: boolean

    /**
     * Define a callable in order to get callback when the first bucketing polling succeed.
     */
    onBucketingSuccess?: (param: { status: number; payload?: BucketingDTO }) => void

    /**
     * Define a callable to get callback when the first bucketing polling failed.
     */
    onBucketingFail?: (error: Error) => void

    /**
     * Define a callable to get callback each time bucketing data from Flagship has updated.
     */
    onBucketingUpdated?: (lastUpdate: Date) => void

    /**
     * You can define an object containing the data received when fetching the bucketing endpoint. Providing this object will make bucketing ready to use and the first polling will immediately check for updates.
     */
    initialBucketing?: BucketingDTO

    decisionApiUrl?: string

    /**
     * You can specify a delay in seconds for hit deduplication. After a hit is sent, any future attempts to send the same hit will be blocked until the specified delay has expired.
     *
     * Note: If a value of 0 is given, no deduplication process will be used.
     */
    hitDeduplicationTime?: number

    /**
     * Define an object that implement the interface visitorCacheImplementation, to handle the visitor cache.
     *
     */
    visitorCacheImplementation?: IVisitorCacheImplementation

    /**
     * You can define an object that implements the IHitCacheImplementation interface to manage hits cache.
     */
    hitCacheImplementation?: IHitCacheImplementation

    /**
     * If it's set to true, hit cache and visitor cache will be disabled otherwise will be enabled.
     */
    disableCache?: boolean

    language?: 0 | 1 | 2

    /**
     * Define options to configure hit batching
     * @deprecated use trackingManagerConfig instead
     */
    trackingMangerConfig?: ITrackingManagerConfig

    /**
     * Define options to configure hit batching
    */
    trackingManagerConfig?: ITrackingManagerConfig

    /**
     * You can define a callback function that will be called each time a flag is exposed to a user (i.e., when an activation hit is sent by the SDK).
     * @deprecated Use **onVisitorExposed** instead
     */
    onUserExposure?: (param: UserExposureInfo)=>void
    /**
     *You can define a callback function that will be called each time a flag is exposed to a visitor (i.e., when an activation hit is sent by the SDK).
     * @param arg
     * @returns
     */
    onVisitorExposed?:(arg: OnVisitorExposed)=> void
    sdkVersion?: string
    /**
     * Define a callable to get a callback whenever the SDK needs to report a log
     */
    onLog?: (level: LogLevel, tag: string, message: string)=>void
    /**
     * In Next.js 13, you can define the time in seconds for storing SDK route cache before revalidation.
     */
    nextFetchConfig?: Record<string, unknown>

    /**
     * (Default value 2) You can specify a delay in seconds for fetch flags call buffering. This means that after the SDK has fetched flags, they will be buffered for the specified delay. During this delay, any subsequent fetch flags calls will return the same flags.
     *
     * Note:
     * - If a value of 0 is given, no buffering process will be used.
     * - If visitor data has changed, the buffering will be bypassed.
     */
    fetchFlagsBufferingTime?: number

    isQAModeEnabled?: boolean
    /*
     * Disable the collect of analytics data
     */
    disableDeveloperUsageTracking?: boolean
  }
