
/**
 * Enum representing the reasons for fetching Flags.
 */
export enum FSFetchReasons {

    /**
     * Indicates that a context has been updated or changed.
     */
    UPDATE_CONTEXT = 'UPDATE_CONTEXT',

    /**
     * Indicates that the XPC method 'authenticate' has been called.
     */
    AUTHENTICATE = 'AUTHENTICATE',

    /**
     * Indicates that the XPC method 'unauthenticate' has been called.
     */
    UNAUTHENTICATE = 'UNAUTHENTICATE',

    /**
     * Indicates that fetching flags has failed.
     */
    FLAGS_FETCHING_ERROR = 'FLAGS_FETCHING_ERROR',

    /**
     * Indicates that flags have been fetched from the cache.
     */
    FLAGS_FETCHED_FROM_CACHE = 'FLAGS_FETCHED_FROM_CACHE',

    /**
     * Indicates that the visitor has been created.
     */
    FLAGS_NEVER_FETCHED = 'FLAGS_NEVER_FETCHED',

    /**
     * Indicates that there is no specific reason for fetching flags.
     */
    NONE = 'NONE'

}
