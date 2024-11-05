export interface IPageView {
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
     * Indicates whether the user has an ad blocker enabled.
     *
     * **Type:** `boolean`
     * **Field:** `adb`
     * **Example:** `true`
     */
    hasAdBlocker: boolean;

    /**
     * The color depth of the user's screen in bits per pixel.
     *
     * **Type:** `number`
     * **Field:** `sd`
     * **Example:** `24`
     */
    screenDepth: number;

    /**
     * The dimensions of the user's browser window.
     *
     * **Type:** `string`
     * **Field:** `sr`
     * **Example:** `"1920x1080"`
     */
    screenSize: string;

    /**
     * The user's tracking preference based on the Do Not Track setting.
     *
     * **Type:** `string`
     * **Field:** `dnt`
     * **Format:** `'unspecified' | 'unknown' | '1' | '0'`
     * **Example:** `'1'`
     */
    doNotTrack: string;

    /**
     * A list of installed fonts in the user's browser.
     *
     * **Type:** `string`
     * **Field:** `fnt`
     * **Example:** `'["arial", "arial black"]'`
     */
    fonts: string;

    /**
     * Indicates if the browser information has been spoofed.
     *
     * **Type:** `boolean`
     * **Field:** `hlb`
     * **Example:** `false`
     */
    hasFakeBrowserInfos: boolean;

    /**
     * Indicates if the language settings have been spoofed.
     *
     * **Type:** `boolean`
     * **Field:** `hll`
     * **Example:** `false`
     */
    hasFakeLanguageInfos: boolean;

    /**
     * Indicates if the operating system information has been spoofed.
     *
     * **Type:** `boolean`
     * **Field:** `hlo`
     * **Example:** `false`
     */
    hasFakeOsInfos: boolean;

    /**
     * Indicates if the screen resolution has been spoofed.
     *
     * **Type:** `boolean`
     * **Field:** `hlr`
     * **Example:** `false`
     */
    hasFakeResolutionInfos: boolean;

    /**
     * The browser's language setting.
     *
     * **Type:** `string`
     * **Field:** `ul`
     * **Example:** `"en-US"`
     */
    userLanguage: string;

    /**
     * The category of the device based on OS and architecture.
     *
     * **Type:** `string`
     * **Field:** `dc`
     * **Format:** `'win32' | 'iphone' | 'linux armv8l'`
     * **Example:** `'iphone'`
     */
    deviceCategory: string;

    /**
     * The device's pixel density ratio.
     *
     * **Type:** `number`
     * **Field:** `pxr`
     * **Example:** `2`
     */
    pixelRatio: number;

    /**
     * A list of installed plugins in the user's browser.
     *
     * **Type:** `string`
     * **Field:** `plu`
     * **Example:** `'["edge pdf viewer::portable document format::application/pdf~pdf"]'`
     * **Optional**
     */
    plugins?: string;

    /**
     * The URL of the referring webpage.
     *
     * **Type:** `string`
     * **Field:** `dr`
     * **Example:** `"https://example.com"`
     */
    documentReferer: string;

    /**
     * The dimensions of the user's viewport in pixels.
     *
     * **Type:** `string`
     * **Field:** `vp`
     * **Format:** `"[width, height]"`
     * **Example:** `"[1920,1080]"`
     */
    viewportSize: string;

    /**
     * Details about the device's touch support.
     *
     * **Type:** `string`
     * **Field:** `tsp`
     * **Format:** `[maxTouchPoints, touchEvent, touchStart]`
     * **Example:** `'[0,false,false]'`
     */
    touchSupport: string;

    /**
     * The current browsing URL.
     *
     * **Type:** `string`
     * **Field:** `url`
     * **Format:** `https://example.com/reports/12345`
     * **Example:** `https://example.com/reports/12345`
     */
    currentUrl: string;

    /**
     * The browser's user agent string.
     *
     * **Type:** `string`
     * **Field:** `ua`
     * **Example:** `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3`
     */
    userAgent: string;

    /**
     * The unique identifier for the customer's user (Bring Your Own ID).
     *
     * **Type:** `string`
     * **Field:** `cuid`
     * **Format:** `12345`
     * **Example:** `12345`
     * **Optional**
     */
    customerUserId?: string;
}
