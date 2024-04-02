import { IHitCacheImplementation } from '../cache/IHitCacheImplementation'
import { IVisitorCacheImplementation } from '../cache/IVisitorCacheImplementation'
import { BucketingDTO } from '../decision/api/bucketingDTO'
import { FSSdkStatus } from '../enum/index'
import { LogLevel } from '../enum/LogLevel'
import { OnVisitorExposed } from '../types'
import { IFlagshipLogManager } from '../utils/FlagshipLogManager'
import { DecisionMode } from './DecisionMode'
import { ITrackingManagerConfig } from './TrackingManagerConfig'

/**
 * Represents the configuration options for the Flagship SDK.
 */
export interface IFlagshipConfig {
  /**
   * The environment ID provided by Flagship.
   */
  envId?: string;

  /**
   * The secure API key provided by Flagship.
   */
  apiKey?: string;

  /**
   * The timeout in seconds for API requests.
   *
   * Default value is 2 seconds.
   */
  timeout?: number;

  /**
   * The maximum log level to display.
   */
  logLevel?: LogLevel;

  /**
   * The SDK running mode. Can be "BUCKETING", "DECISION_API" or "BUCKETING_EDGE".
   */
  decisionMode?: DecisionMode;

  /**
   * A callback function to be called when the SDK status has changed.
   * @param status - The new status of the SDK.
   */
  onSdkStatusChanged?: (status: FSSdkStatus) => void;

  /**
   * A custom implementation of the LogManager interface to receive logs from the SDK.
   */
  logManager?: IFlagshipLogManager;

  /**
   * Determines whether to automatically fetch modification data when creating a new FlagshipVisitor.
   */
  fetchNow?: boolean;

  /**
   * **Bucketing mode only**
   *
   * The delay in seconds between two bucketing polling requests.
   *
   * If 0 is given, it will only poll once at start time.
   *
   * Default value is 5 seconds.
   */
  pollingInterval?: number;

  /**
   * **Bucketing mode only**
   *
   * If true, the SDK will fetch the visitor's segment from the universal data connector each time `fetchFlags` is called and append those segments in the visitor context.
   */
  fetchThirdPartyData?: boolean;

  /**
   * **client-side only**
   *
   * If true, the SDK will save the visitor ID and/or anonymous ID in the local storage and reuse it for the next session if `visitorId` is not set, to maintain cross-session visitor experience.
   *
   * Default value is true.
   */
  reuseVisitorIds?: boolean;

  /**
   * A callback function to be called when the first bucketing polling succeeds.
   * @param param - An object containing the status and payload of the bucketing response.
   */
  onBucketingSuccess?: (param: { status: number; payload: BucketingDTO }) => void;

  /**
   * A callback function to be called when the first bucketing polling fails.
   * @param error - The error object representing the failure.
   */
  onBucketingFail?: (error: Error) => void;

  /**
   * A callback function to be called each time bucketing data from Flagship has been updated.
   * @param lastUpdate - The date of the last update.
   */
  onBucketingUpdated?: (lastUpdate: Date) => void;

  /**
   * An object containing the data received when fetching the bucketing endpoint.
   * Providing this object will make bucketing ready to use and the first polling will immediately check for updates.
   */
  initialBucketing?: BucketingDTO;

  /**
   * The URL of the decision API.
   */
  decisionApiUrl?: string;

  /**
   * The delay in seconds for hit deduplication. After a hit is sent, any future attempts to send the same hit will be blocked until the specified delay has expired.
   * If a value of 0 is given, no deduplication process will be used.
   */
  hitDeduplicationTime?: number;

  /**
   * An object that implements the IVisitorCacheImplementation interface to handle the visitor cache.
   */
  visitorCacheImplementation?: IVisitorCacheImplementation;

  /**
   * An object that implements the IHitCacheImplementation interface to manage hits cache.
   */
  hitCacheImplementation?: IHitCacheImplementation;

  /**
   * If set to true, hit cache and visitor cache will be disabled; otherwise, they will be enabled.
   */
  disableCache?: boolean;

  language?: 0 | 1 | 2;

  /**
   * Options to configure hit batching.
   */
  trackingManagerConfig?: ITrackingManagerConfig;

  /**
   * A callback function to be called each time a flag is exposed to a visitor (i.e., when an activation hit is sent by the SDK).
   * @param arg - The argument containing information about the exposed flag.
   */
  onVisitorExposed?: (arg: OnVisitorExposed) => void;

  sdkVersion?: string;

  /**
   * A callback function to be called whenever the SDK needs to report a log.
   * @param level - The log level.
   * @param tag - The tag associated with the log message.
   * @param message - The log message.
   */
  onLog?: (level: LogLevel, tag: string, message: string) => void;

    /**
     * In Next.js 13, you can define the time in seconds for storing SDK route cache before revalidation.
     */
  nextFetchConfig?: Record<string, unknown>;

  /**
   * The delay in seconds for buffering fetch flags calls. After the SDK has fetched flags, they will be buffered for the specified delay.
   * During this delay, any subsequent fetch flags calls will return the same flags.
   * If a value of 0 is given, no buffering process will be used.
   * If visitor data has changed, the buffering will be bypassed.
   */
  fetchFlagsBufferingTime?: number;

  /**
   * Determines whether to disable the collection of analytics data.
   */
  disableDeveloperUsageTracking?: boolean;
}
