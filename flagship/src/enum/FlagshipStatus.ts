export enum FlagshipStatus {
  /**
   * It is the default initial status. This status remains until the sdk has been initialized successfully.
   */
   NOT_INITIALIZED = 0,

  /**
   * Flagship SDK is starting.
   */
   STARTING = 1,
  /**
   * Flagship SDK has been started successfully but is still polling campaigns.
   */
   POLLING = 2,
  /**
   * Flagship SDK is ready but is running in Panic mode: All features are disabled except the one which refresh this status.
   */
   READY_PANIC_ON = 3,
  /**
   * Flagship SDK is ready to use.
   */
   READY = 4
}
