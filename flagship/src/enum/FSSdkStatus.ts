/**
 * Enum representing the status of the Flagship SDK.
 */
export enum FSSdkStatus {
  /**
   * It is the default initial status. This status remains until the sdk has been initialized successfully.
   */
  SDK_NOT_INITIALIZED = 0,

  /**
   * The SDK is currently initializing.
   */
  SDK_INITIALIZING = 1,

  /**
   * Flagship SDK is ready but is running in Panic mode: All features are disabled except the one which refresh this status.
   */
  SDK_PANIC = 2,

  /**
   * The Initialization is done, and Flagship SDK is ready to use.
   */
  SDK_INITIALIZED = 3
}
