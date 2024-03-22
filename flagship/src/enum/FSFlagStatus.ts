
/**
 * Represents the status of the flags in the Flagship SDK.
 */
export enum FSFlagStatus {
    /**
     * The flags have been successfully fetched from the API or re-evaluated in bucketing mode.
     */
    FETCHED = 'FETCHED',

    /**
     * The flags need to be re-fetched due to a change in context, or because the flags were loaded from cache or XPC.
     */
    FETCH_REQUIRED = 'FETCH_REQUIRED',

    /**
     * The flag was not found or do not exist.
     */
    NOT_FOUND = 'NOT_FOUND',

    /**
     * The SDK is in PANIC mode: All features are disabled except for the one to fetch flags.
     */
    PANIC = 'PANIC',
}