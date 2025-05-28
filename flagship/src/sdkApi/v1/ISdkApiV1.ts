export interface ISdkApiV1 {
    /**
     * Get the action tracking nonce
     */
    _getActionTrackingNonce(): string|undefined;
    /**
     * Get the current visitor ID or undefined if the visitorId is BYOID
     * @returns {string} The visitor ID.
     */
    _getVisitorId(): string|undefined;
}
