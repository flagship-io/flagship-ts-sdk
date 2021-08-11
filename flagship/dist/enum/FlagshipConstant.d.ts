/**
 * SDK language
 */
export declare const SDK_LANGUAGE = "TypeScript";
/**
 * Default request timeout in second
 */
export declare const REQUEST_TIME_OUT = 2;
/**
 * Decision api base url
 */
export declare const BASE_API_URL = "https://decision.flagship.io/v2/";
export declare const HIT_API_URL = "https://ariane.abtasty.com";
export declare const BUCKETING_API_URL = "https://cdn.flagship.io/{0}/bucketing.json";
export declare const BUCKETING_API_CONTEXT_URL = "https://decision.flagship.io/v2/{0}/events";
export declare const URL_CAMPAIGNS = "/campaigns";
export declare const URL_ACTIVATE_MODIFICATION = "activate";
export declare const EXPOSE_ALL_KEYS = "exposeAllKeys";
/**
 * SDK version
 */
export declare const SDK_VERSION = "v2";
/**
 * Message Info
 */
export declare const SDK_STARTED_INFO = "Flagship SDK (version: {0}) READY";
export declare const FLAGSHIP_SDK = "Flagship SDK";
export declare const EMIT_READY = "ready";
/**
 * Message Error
 */
export declare const INITIALIZATION_PARAM_ERROR = "Params 'envId' and 'apiKey' must not be null or empty.";
export declare const ERROR = "error";
export declare const CONTEXT_NULL_ERROR = "Context must not to be null";
export declare const CONTEXT_PARAM_ERROR = "params {0} must be a non null String, and 'value' must be one of the following types , Number, Boolean";
export declare const GET_MODIFICATION_CAST_ERROR = "Modification for key {0} has a different type. Default value is returned.";
export declare const GET_MODIFICATION_MISSING_ERROR = "No modification for key {0}. Default value is returned.";
export declare const GET_MODIFICATION_KEY_ERROR = "Key {0} must not be null. Default value is returned.";
export declare const GET_MODIFICATION_ERROR = "No modification for key {0}.";
export declare const DECISION_MANAGER_MISSING_ERROR = "decisionManager must not be null.";
export declare const TRACKER_MANAGER_MISSING_ERROR = "trackerManager must not be null.";
export declare const CURL_LIBRARY_IS_NOT_LOADED = "curl library is not loaded";
export declare const TYPE_ERROR = "{0} must be a {1}";
export declare const TYPE_INTEGER_ERROR = "value of {0} is not an {1}, it will be truncated to {1}";
export declare const VISITOR_ID_ERROR = "visitorId must not be null or empty";
export declare const PANIC_MODE_ERROR = "{0} deactivated while panic mode is on.";
export declare const METHOD_DEACTIVATED_CONSENT_ERROR = "Method {0} is deactivated for visitor {1} : visitor did not consent.";
export declare const METHOD_DEACTIVATED_ERROR = "Method {0} is deactivated while SDK status is: {1}.";
export declare const METHOD_DEACTIVATED_BUCKETING_ERROR = "Method {0} is deactivated on Bucketing mode.";
export declare const FLAGSHIP_VISITOR_NOT_AUTHENTICATE = "Visitor is not authenticated yet";
export declare const PREDEFINED_CONTEXT_TYPE_ERROR = "Predefined Context {0} must be type of {1}";
export declare const PROCESS = "process";
export declare const PROCESS_INITIALIZATION = "INITIALIZATION";
export declare const PROCESS_UPDATE_CONTEXT = "UPDATE CONTEXT";
export declare const PROCESS_GET_MODIFICATION = "GET MODIFICATION";
export declare const PROCESS_GET_MODIFICATION_INFO = "GET MODIFICATION INFO";
export declare const PROCESS_NEW_VISITOR = "NEW VISITOR";
export declare const PROCESS_ACTIVE_MODIFICATION = "ACTIVE MODIFICATION";
export declare const PROCESS_SYNCHRONIZED_MODIFICATION = "SYNCHRONIZED MODIFICATION";
export declare const PROCESS_SEND_HIT = "SEND HIT";
export declare const PROCESS_SEND_ACTIVATE = "SEND ACTIVATE";
export declare const PROCESS_GET_CAMPAIGNS = "GET CAMPAIGNS";
export declare const PROCESS_GET_ALL_MODIFICATION = "GET ALL MODIFICATIONS";
export declare const PROCESS_MODIFICATIONS_FOR_CAMPAIGN = "GET MODIFICATION FOR CAMPAIGN";
export declare const CUSTOMER_ENV_ID_API_ITEM = "cid";
export declare const CUSTOMER_UID = "cuid";
export declare const ANONYMOUS_ID = "aid";
export declare const VISITOR_ID_API_ITEM = "vid";
export declare const VARIATION_GROUP_ID_API_ITEM = "caid";
export declare const VARIATION_ID_API_ITEM = "vaid";
export declare const DS_API_ITEM = "ds";
export declare const T_API_ITEM = "t";
export declare const DL_API_ITEM = "dl";
export declare const SDK_APP = "APP";
export declare const TID_API_ITEM = "tid";
export declare const TA_API_ITEM = "ta";
export declare const TT_API_ITEM = "tt";
export declare const TC_API_ITEM = "tc";
export declare const TCC_API_ITEM = "tcc";
export declare const ICN_API_ITEM = "icn";
export declare const SM_API_ITEM = "sm";
export declare const PM_API_ITEM = "pm";
export declare const TR_API_ITEM = "tr";
export declare const TS_API_ITEM = "ts";
export declare const IN_API_ITEM = "in";
export declare const IC_API_ITEM = "ic";
export declare const IP_API_ITEM = "ip";
export declare const IQ_API_ITEM = "iq";
export declare const IV_API_ITEM = "iv";
export declare const EVENT_CATEGORY_API_ITEM = "ec";
export declare const EVENT_ACTION_API_ITEM = "ea";
export declare const EVENT_LABEL_API_ITEM = "el";
export declare const EVENT_VALUE_API_ITEM = "ev";
export declare const HEADER_X_API_KEY = "x-api-key";
export declare const HEADER_CONTENT_TYPE = "Content-Type";
export declare const HEADER_X_SDK_CLIENT = "x-sdk-client";
export declare const HEADER_X_SDK_VERSION = "x-sdk-version";
export declare const HEADER_APPLICATION_JSON = "application/json";
