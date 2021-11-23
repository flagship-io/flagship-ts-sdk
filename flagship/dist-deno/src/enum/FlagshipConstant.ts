/**
 * SDK language
 */

export const SDK_LANGUAGE = 'TypeScript'

/**
 * Default request timeout in second
 */
export const REQUEST_TIME_OUT = 2

export const DEFAULT_DEDUPLICATION_TIME = 2.5
export const DEFAULT_POLLING_INTERVAL = 1

/**
 * Decision api base url
 */
export const BASE_API_URL = 'https://decision.flagship.io/v2/'
export const HIT_API_URL = 'https://ariane.abtasty.com'
export const BUCKETING_API_URL = 'https://cdn.flagship.io/{0}/bucketing.json'
export const BUCKETING_API_CONTEXT_URL = 'https://decision.flagship.io/v2/{0}/events'
export const HIT_CONSENT_URL = 'https://ariane.abtasty.com'
export const URL_CAMPAIGNS = '/campaigns'
export const URL_ACTIVATE_MODIFICATION = 'activate'

export const EXPOSE_ALL_KEYS = 'exposeAllKeys'
export const SEND_CONTEXT_EVENT = 'sendContextEvent'

/**
 * SDK version
 */
export const SDK_VERSION = 'v2'

export const VISITOR_CACHE_VERSION = 1
export const HIT_CACHE_VERSION = 1
export const DEFAULT_HIT_CACHE_TIME = 14400000

/**
 * Message Info
 */

export const SDK_STARTED_INFO = 'Flagship SDK (version: {0}) READY'
export const FLAGSHIP_SDK = 'Flagship SDK'

export const EMIT_READY = 'ready'

/**
 * Message Error
 */
export const INITIALIZATION_PARAM_ERROR =
  "Params 'envId' and 'apiKey' must not be null or empty."
export const ERROR = 'error'
export const CONTEXT_NULL_ERROR = 'Context must not to be null'
export const CONTEXT_PARAM_ERROR =
  "params {0} must be a non null String, and 'value' must be one of the following types , Number, Boolean"
export const GET_MODIFICATION_CAST_ERROR =
  'Modification for key {0} has a different type. Default value is returned.'
export const GET_MODIFICATION_MISSING_ERROR =
  'No modification for key {0}. Default value is returned.'
export const GET_MODIFICATION_KEY_ERROR =
  'Key {0} must not be null. Default value is returned.'
export const GET_MODIFICATION_ERROR = 'No modification for key {0}.'
export const DECISION_MANAGER_MISSING_ERROR =
  'decisionManager must not be null.'
export const TRACKER_MANAGER_MISSING_ERROR = 'trackerManager must not be null.'
export const CURL_LIBRARY_IS_NOT_LOADED = 'curl library is not loaded'
export const TYPE_ERROR = '{0} must be a {1}'
export const TYPE_INTEGER_ERROR =
  'value of {0} is not an {1}, it will be truncated to {1}'
export const VISITOR_ID_ERROR = 'visitorId must not be null or empty'
export const PANIC_MODE_ERROR = '{0} deactivated while panic mode is on.'
export const METHOD_DEACTIVATED_CONSENT_ERROR = 'Method {0} is deactivated for visitor {1} : visitor did not consent.'
export const METHOD_DEACTIVATED_ERROR = 'Method {0} is deactivated while SDK status is: {1}.'
export const METHOD_DEACTIVATED_BUCKETING_ERROR = 'Method {0} is deactivated on Bucketing mode.'
export const FLAGSHIP_VISITOR_NOT_AUTHENTICATE = 'Visitor is not authenticated yet'
export const PREDEFINED_CONTEXT_TYPE_ERROR = 'Predefined Context {0} must be type of {1}'
export const METHOD_DEACTIVATED_SEND_CONSENT_ERROR = 'Send consent hit is deactivated while SDK status is: {1}.'

// Process
export const PROCESS = 'process'
export const PROCESS_INITIALIZATION = 'INITIALIZATION'
export const PROCESS_UPDATE_CONTEXT = 'UPDATE CONTEXT'
export const PROCESS_GET_MODIFICATION = 'GET MODIFICATION'
export const PROCESS_GET_MODIFICATION_INFO = 'GET MODIFICATION INFO'
export const PROCESS_NEW_VISITOR = 'NEW VISITOR'
export const PROCESS_ACTIVE_MODIFICATION = 'ACTIVE MODIFICATION'
export const PROCESS_SYNCHRONIZED_MODIFICATION = 'SYNCHRONIZED MODIFICATION'
export const PROCESS_SEND_HIT = 'SEND HIT'
export const PROCESS_SEND_ACTIVATE = 'SEND ACTIVATE'
export const PROCESS_GET_CAMPAIGNS = 'GET CAMPAIGNS'
export const PROCESS_GET_ALL_MODIFICATION = 'GET ALL MODIFICATIONS'
export const PROCESS_MODIFICATIONS_FOR_CAMPAIGN = 'GET MODIFICATION FOR CAMPAIGN'
export const PROCESS_CACHE_HIT = 'cacheHit'

// Api items

export const CUSTOMER_ENV_ID_API_ITEM = 'cid'
export const CUSTOMER_UID = 'cuid'
export const ANONYMOUS_ID = 'aid'
export const VISITOR_ID_API_ITEM = 'vid'
export const VARIATION_GROUP_ID_API_ITEM = 'caid'
export const VARIATION_ID_API_ITEM = 'vaid'
export const DS_API_ITEM = 'ds'
export const T_API_ITEM = 't'
export const DL_API_ITEM = 'dl'
export const SDK_APP = 'APP'
export const TID_API_ITEM = 'tid'
export const TA_API_ITEM = 'ta'
export const TT_API_ITEM = 'tt'
export const TC_API_ITEM = 'tc'
export const TCC_API_ITEM = 'tcc'
export const ICN_API_ITEM = 'icn'
export const SM_API_ITEM = 'sm'
export const PM_API_ITEM = 'pm'
export const TR_API_ITEM = 'tr'
export const TS_API_ITEM = 'ts'
export const IN_API_ITEM = 'in'
export const IC_API_ITEM = 'ic'
export const IP_API_ITEM = 'ip'
export const IQ_API_ITEM = 'iq'
export const IV_API_ITEM = 'iv'
export const EVENT_CATEGORY_API_ITEM = 'ec'
export const EVENT_ACTION_API_ITEM = 'ea'
export const EVENT_LABEL_API_ITEM = 'el'
export const EVENT_VALUE_API_ITEM = 'ev'
export const USER_IP_API_ITEM = 'uip'
export const SCREEN_RESOLUTION_API_ITEM = 'sr'
export const USER_LANGUAGE = 'ul'
export const SESSION_NUMBER = 'sn'

export const HEADER_X_API_KEY = 'x-api-key'
export const HEADER_CONTENT_TYPE = 'Content-Type'
export const HEADER_X_SDK_CLIENT = 'x-sdk-client'
export const HEADER_X_SDK_VERSION = 'x-sdk-version'
export const HEADER_APPLICATION_JSON = 'application/json'
