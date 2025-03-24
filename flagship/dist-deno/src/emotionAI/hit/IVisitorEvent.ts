export interface IVisitorEvent {
    /**
     * The unique identifier for the customer's account.
     *
     * **Type:** `string`
     * **Field:** `cid`
     * **Example:** `"CIDXXXXXXXXXXX"`
     */
    customerAccountId: string;

        /**
     * The unique identifier for the visitor.
     *
     * **Type:** `string`
     * **Field:** `vid`
     * **Example:** `"visitor_67890"`
     */
        visitorId: string;

    /**
     * The current browsing URL.
     *
     * **Type:** `string`
     * **Field:** `dl`
     * **Format:** `https://example.com/reports/12345`
     * **Example:** `https://example.com/reports/12345`
     */
    currentUrl: string;

    /**
     * all mouse position :y,x,last 5 digits from timestamp Separated by semi colon (limited to 2000 characters max)
     *
     * **Type:** `string`
     * **Field:** `cp`
     * **Format:** `y1,x1,timestamp1;y2,x2,timestamp2;...`
     * **Example:** `1305,115,54481;1293,115,54494;1248,119,54496;1236,121,54504;`
     */
    clickPath?: string;

    /**
     * Position of the clic : y,x, last 5 digits from timestamp, clic duration in ms
     *
     * **Type:** `string`
     * **Field:** `cpo`
     * **Format:** `y,x,timestamp,duration`
     * **Example:** `1305,115,54481,100;`
     */
    clickPosition?: string;

        /**
     * The dimensions of the user's browser window.
     *
     * **Type:** `string`
     * **Field:** `sr`
     * **Example:** `width,height;`
     * **Example:** `1516,464;`
     */
    screenSize: string;

    /**
     * Scroll position : Desktop: y, last 5 digits from timestamp and Mobile touch : x,y, last 5 digits from timestamp
     *
     * **Type:** `string`
     * **Field:** `spo`
     * **Format Desktop:** `y,timestamp;`
     * **Format Mobile:** `x,y,timestamp;`
     * **Example Desktop:** `0,54481;`
     * **Example Mobile:** `0,0,54481;`
     */
    scrollPosition?: string;

    /**
     * Convert the visitor event to an object that can be sent to the Flagship API.
     */
    toApiKeys (): Record<string, string>
}
