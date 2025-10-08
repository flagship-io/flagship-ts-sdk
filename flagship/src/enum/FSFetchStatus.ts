/**
 * Represents the status of the flags in the Flagship SDK.
 */
export enum FSFetchStatus {
    /**
     * The flags have been successfully fetched from the API or re-evaluated in bucketing mode.
     */
    FETCHED = 'FETCHED',

    /**
     * The flags are currently being fetched from the API or re-evaluated in bucketing mode.
     */
    FETCHING = 'FETCHING',

    /**
     * The flags need to be re-fetched due to a change in context, or because the flags were loaded from cache or XPC.
     */
    FETCH_REQUIRED = 'FETCH_REQUIRED',

    /**
     * The SDK is in PANIC mode: All features are disabled except for the one to fetch flags.
     */
    PANIC = 'PANIC',

    /**
     * The flags have been initialized from initial data provided during visitor creation .
     */
    INITIAL_DATA = 'INITIAL_DATA',
}
