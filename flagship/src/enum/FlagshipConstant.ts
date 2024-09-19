import { version } from '../sdkVersion'
import { SdkInfoType } from '../types'

/**
 * SDK language
 */

export const SDK_INFO:SdkInfoType = {
  name: 'TypeScript',
  version
}

/**
 * Default request timeout in second
 */
export const REQUEST_TIME_OUT = 2

export const FETCH_FLAG_BUFFERING_DEFAULT_TIME = 2

export const DEFAULT_DEDUPLICATION_TIME = 2.5
export const DEFAULT_POLLING_INTERVAL = 5

export const DEFAULT_SERVER_TIME_INTERVAL = 10
export const DEFAULT_SERVER_POOL_MAX_SIZE = 100

export const DEFAULT_BROWSER_TIME_INTERVAL = 5
export const DEFAULT_BROWSER_POOL_MAX_SIZE = 10

export const BATCH_MAX_SIZE = 2500000

export const ANALYTIC_HIT_ALLOCATION = 1

export const HTTP_CODE_200 = 200
export const HTTP_CODE_304 = 304

/**
 * Decision api base url
 */
export const BASE_API_URL = 'https://decision.flagship.io/v2/'
export const HIT_API_URL = 'https://ariane.abtasty.com'
export const HIT_EVENT_URL = 'https://events.flagship.io'
export const TROUBLESHOOTING_HIT_URL = 'https://events.flagship.io/troubleshooting'
export const USAGE_HIT_URL = 'https://events.flagship.io/analytics'
export const BUCKETING_API_URL = 'https://cdn.flagship.io/{0}/bucketing.json'
export const BUCKETING_API_CONTEXT_URL = 'https://decision.flagship.io/v2/{0}/events'
export const THIRD_PARTY_SEGMENT_URL = 'https://api-data-connector.flagship.io/accounts/{0}/segments/{1}'
export const HIT_CONSENT_URL = 'https://ariane.abtasty.com'
export const URL_CAMPAIGNS = '/campaigns'
export const URL_ACTIVATE_MODIFICATION = 'activate'
export const QA_ASSISTANT_PROD_URL = 'https://qa-assistant.flagship.io/bundle.js'
export const QA_ASSISTANT_STAGING_URL = 'https://staging-qa-assistant.flagship.io/bundle.js'
export const QA_ASSISTANT_LOCAL_URL = 'https://local-qa-assistant.flagship.io/bundle.js'
export const FS_QA_ASSISTANT = 'fs_qa_assistant'
export const FS_QA_ASSISTANT_STAGING = 'fs_qa_assistant_staging'
export const FS_QA_ASSISTANT_LOCAL = 'fs_qa_assistant_local'
export const TAG_QA_ASSISTANT = 'abtasty_qa_assistant'
export const TAG_QA_ASSISTANT_STAGING = 'abtasty_qa_assistant_staging'
export const TAG_QA_ASSISTANT_LOCAL = 'abtasty_qa_assistant_local'

export const TAG_QA_URL = 'qa-assistant.abtasty.com'
export const FS_QA_URL = 'qa-assistant.flagship.io'

export const EXPOSE_ALL_KEYS = 'exposeAllKeys'
export const SEND_CONTEXT_EVENT = 'sendContextEvent'

export const FS_CONSENT = 'fs_consent'

export const FS_IS_QA_MODE_ENABLED = 'FS_IS_QA_MODE_ENABLED'
export const FS_FORCED_VARIATIONS = 'FS_FORCED_VARIATIONS'
export const FS_QA_ASSISTANT_SCRIPT_TAG_ID = 'FS_QA_ASSISTANT_SCRIPT_TAG_ID'

/**
 * SDK version
 */
export const SDK_VERSION = version

export const VISITOR_CACHE_VERSION = 1
export const HIT_CACHE_VERSION = 1
export const DEFAULT_HIT_CACHE_TIME_MS = 14400000
export const MAX_ACTIVATE_HIT_PER_BATCH = 100

/**
 * Message Info
 */

export const SDK_STARTED_INFO = 'Flagship SDK (version: {0}) {1}'
export const FLAGSHIP_SDK = 'Flagship SDK'

export const EMIT_READY = 'ready'

export const EMIT_STATUS = 'status'

export const NO_BATCHING_WITH_CONTINUOUS_CACHING_STRATEGY = 3

export const JS_DOC_URL = 'https://docs.developers.flagship.io/docs/js-v3'

export const PANIC_MODE_DOC_URL = 'https://docs.developers.flagship.io/docs/glossary#panic-mode'
/**
 * Message Error
 */
export const INITIALIZATION_PARAM_ERROR = `Params 'envId' and 'apiKey' must not be null or empty.
  Learn more: ${JS_DOC_URL}#initialization`
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
export const ACTIVATE_MODIFICATION_KEY_ERROR =
  'Key {0} must not be null, no activate will be sent.'
export const GET_MODIFICATION_ERROR = 'No modification for key {0}.'
export const GET_FLAG_ERROR = 'No flag for key {0}.'
export const ACTIVATE_MODIFICATION_ERROR = 'No modification for key {0}, no activate will be sent.'
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
export const METHOD_DEACTIVATED_ERROR = 'Visitor {0}, method {1} is deactivated while SDK status is: {2}.'

export const METHOD_DEACTIVATED_SEND_CONSENT_ERROR = 'Send consent hit is deactivated while SDK status is: {1}.'
export const TROUBLESHOOTING_HIT_ADDED_IN_QUEUE = 'The TROUBLESHOOTING HIT has been added to the pool queue : {0}'
export const ANALYTICS_HIT_ADDED_IN_QUEUE = 'The USAGE HIT has been added to the pool queue : {0}'
export const ACTIVATE_ADDED_IN_QUEUE = 'The ACTIVATE has been added to the pool queue : {0}'
export const HIT_ADDED_IN_QUEUE = 'The HIT has been added into the pool queue : {0}'
export const ADD_HIT = 'ADD HIT'
export const ADD_TROUBLESHOOTING_HIT = 'ADD TROUBLESHOOTING HIT'
export const ADD_USAGE_HIT = 'ADD USAGE HIT'
export const ADD_ACTIVATE = 'ADD ACTIVATE'
export const BATCH_SENT_SUCCESS = 'Batch hit has been sent : {0}'
export const TROUBLESHOOTING_SENT_SUCCESS = 'Troubleshooting hit has been sent : {0}'
export const ANALYTICS_HIT_SENT_SUCCESS = 'Usage hit has been sent : {0}'
export const ACTIVATE_SENT_SUCCESS = 'Activate hit has been sent : {0}'
export const SEND_BATCH = 'SEND BATCH'
export const SEND_TROUBLESHOOTING = 'SEND TROUBLESHOOTING'
export const SEND_USAGE_HIT = 'SEND USAGE HIT'
export const SEND_ACTIVATE = 'SEND ACTIVATE'
export const SEND_SEGMENT_HIT = 'SEND SEGMENT HIT'
export const SEND_HIT = 'SEND HIT'
export const EVENT_SUFFIX = 'events'
export const FETCH_FLAGS_BUFFERING_MESSAGE = 'Visitor {0}, fetchFlags has been ignored and will continue to be ignored for the next {1}ms, this delay can be changed with `fetchFlagsBufferingTime` option in the SDK config'
export const VISITOR_SYNC_FLAGS_MESSAGE = 'without calling `fetchFlags` method afterwards. So, the value of the flag `{1}` might be outdated'

export const NEW_VISITOR_NOT_READY = `You can't create a new visitor without first calling the "Flagship.start" method.
Learn more: ${JS_DOC_URL}#initialization
`
export const LOOKUP_HITS_JSON_OBJECT_ERROR = 'JSON DATA must fit the type HitCacheDTO'
export const ACTIVATE_BATCH_LENGTH = 5

// Process
export const PROCESS = 'process'
export const PROCESS_INITIALIZATION = 'INITIALIZATION'
export const PROCESS_UPDATE_CONTEXT = 'UPDATE CONTEXT'
export const PROCESS_GET_MODIFICATION = 'GET MODIFICATION'
export const PROCESS_GET_MODIFICATION_INFO = 'GET MODIFICATION INFO'
export const PROCESS_NEW_VISITOR = 'NEW VISITOR'
export const PROCESS_ACTIVE_MODIFICATION = 'ACTIVE MODIFICATION'
export const PROCESS_SYNCHRONIZED_MODIFICATION = 'SYNCHRONIZED MODIFICATION'
export const PROCESS_SEND_HIT = 'ADD HIT'
export const PROCESS_SEND_ACTIVATE = 'SEND ACTIVATE'
export const PROCESS_GET_CAMPAIGNS = 'GET CAMPAIGNS'
export const PROCESS_GET_ALL_MODIFICATION = 'GET ALL MODIFICATIONS'
export const PROCESS_MODIFICATIONS_FOR_CAMPAIGN = 'GET MODIFICATION FOR CAMPAIGN'
export const PROCESS_CACHE_HIT = 'CACHE HIT'
export const PROCESS_FLUSH_HIT = 'FLUSH HIT'
export const PROCESS_LOOKUP_HIT = 'LOOKUP HIT'

// Api items

export const BATCH = 'batch'
export const CUSTOMER_ENV_ID_API_ITEM = 'cid'
export const CUSTOMER_ENV_ID_API_ACTIVATE = 'cid'
export const CUSTOMER_UID = 'cuid'
export const ANONYMOUS_ID = 'aid'
export const VISITOR_ID_API_ITEM = 'vid'
export const VARIATION_GROUP_ID_API_ITEM = 'caid'
export const VARIATION_GROUP_ID_API_ITEM_ACTIVATE = 'caid'
export const VISITOR_CONSENT = 'vc'
export const CAMPAIGN_ID = 'caid'
export const VARIATION_ID_API_ITEM = 'vaid'
export const DS_API_ITEM = 'ds'
export const T_API_ITEM = 't'
export const QT_API_ITEM = 'qt'
export const QA_MODE_API_ITEM = 'qa'
export const DL_API_ITEM = 'dl'
export const SL_ITEM = 'sl'
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
export const S_API_ITEM = 's'
export const EVENT_CATEGORY_API_ITEM = 'ec'
export const EVENT_ACTION_API_ITEM = 'ea'
export const EVENT_LABEL_API_ITEM = 'el'
export const EVENT_VALUE_API_ITEM = 'ev'
export const USER_IP_API_ITEM = 'uip'
export const SCREEN_RESOLUTION_API_ITEM = 'sr'
export const USER_LANGUAGE = 'ul'
export const SESSION_NUMBER = 'sn'

export const HEADER_X_API_KEY = 'x-api-key'
export const HEADER_X_ENV_ID = 'x-env-id'
export const HEADER_CONTENT_TYPE = 'Content-Type'
export const HEADER_X_SDK_CLIENT = 'x-sdk-client'
export const HEADER_X_SDK_VERSION = 'x-sdk-version'
export const HEADER_APPLICATION_JSON = 'application/json'
export const HEADER_X_APP = 'x-app'

// Log

export const INITIALIZATION_STARTING = 'Flagship SDK version {0} is starting in {1} mode with config {2}'
export const BUCKETING_POOLING_STARTED = 'Bucketing polling process has been started'
export const BUCKETING_POOLING_STOPPED = 'Bucketing polling process has been stopped'
export const PROCESS_BUCKETING = 'BUCKETING'
export const POLLING_EVENT_200 = 'Polling event with code status 200 : {0}'
export const POLLING_EVENT_300 = 'Polling event with code status 304'
export const POLLING_EVENT_FAILED = 'Polling event failed with error'
export const PROCESS_SDK_STATUS = 'SDK STATUS'
export const SDK_STATUS_CHANGED = 'SDK status has changed:  {0}'
export const SAVE_VISITOR_INSTANCE = 'Visitor {0} has been saved in SDK instance'
export const VISITOR_CREATED = 'Visitor {0} has been created with context {1}, isAuthenticated:{2} and hasConsented {3}'
export const VISITOR_PROFILE_LOADED = 'Visitor profile has been loaded {0}'
export const VISITOR_ID_GENERATED = 'Visitor identifier is empty. A UUID {0} has been generated.'
export const PREDEFINED_CONTEXT_LOADED = 'Predefined Context have been loaded {0}'
export const CONTEXT_KEY_ERROR = `Visitor {0}, the key '{1}' must be a non null String.
Learn more: ${JS_DOC_URL}#updating-the-visitor-context`
export const CONTEXT_VALUE_ERROR = `Visitor {0}, 'value' for key '{1}[], must be one of the following types : String, Number, Boolean
Learn more: ${JS_DOC_URL}#updating-the-visitor-context`
export const PREDEFINED_CONTEXT_TYPE_ERROR = `visitor {0}, Predefined Context {0} must be of type {1}
Learn more: ${JS_DOC_URL}#predefined-user-context-keys-`
export const CONTEXT_KEY_VALUE_UPDATE = 'visitor `{0}`, context have been updated: key {1}, value {2}, Context {3}'
export const CONTEXT_OBJET_PARAM_UPDATE = 'visitor `{0}`, context have been updated: key/value {1}, Context {2}'
export const CLEAR_CONTEXT = 'visitor `{0}`, context has been cleared cleared `{1}`'
export const PROCESS_CLEAR_CONTEXT = 'CLEAR_CONTEXT'
export const CONSENT_CHANGED = 'Visitor `{0}` consent has been changed : {1}'
export const PROCESS_SET_CONSENT = 'SET_CONSENT'
export const FETCH_CAMPAIGNS_SUCCESS = 'Visitor {0}, anonymousId {1} with context {2} has just fetched campaigns {3} in {4} ms'
export const FETCH_CAMPAIGNS_FROM_CACHE = 'Visitor {0}, anonymousId {1} with context {2} has just fetched campaigns from cache {3} in {4} ms'
export const FETCH_FLAGS_FROM_CAMPAIGNS = 'Visitor {0}, anonymousId {1} with context {2} has just fetched flags {3} from Campaigns'
export const FETCH_FLAGS_STARTED = 'visitor `{0}` fetchFlags process is started'
export const FETCH_FLAGS_PANIC_MODE = 'Panic mode is enabled : all feature are disabled except fetchFlags.'
export const PROCESS_FETCHING_FLAGS = 'FETCH_FLAGS'
export const GET_FLAG_MISSING_ERROR = 'For the visitor "{0}", no flags were found with the key "{1}". Therefore, the default value "{2}" has been returned.'
export const GET_FLAG_NOT_FOUND = 'For the visitor "{0}", no flags were found with the key "{1}". Therefore, an empty flag has been returned.'
export const FETCH_FLAGS_MISSING = 'Visitor {0} has {1} without calling fetchFlags method, '
export const FLAG_VALUE = 'FLAG_VALUE'
export const GET_FLAG = 'GET_FLAG'
export const GET_FLAG_CAST_ERROR = 'For the visitor "{0}", the flag with key "{1}" has a different type compared to the default value. Therefore, the default value "{2}" has been returned.'
export const GET_FLAG_VALUE = 'Visitor {0}, Flag for key {1} returns value {2}'
export const USER_EXPOSED_FLAG_ERROR = 'For the visitor "{0}", no flags were found with the key "{1}". As a result, user exposure will not be sent.'
export const VISITOR_EXPOSED_VALUE_NOT_CALLED = 'Visitor "{0}", the flag with the key "{1}" has been exposed without calling the `getValue` method first.'
export const FLAG_VISITOR_EXPOSED = 'FLAG_VISITOR_EXPOSED'
export const USER_EXPOSED_CAST_ERROR = 'For the visitor "{0}", the flag with key "{1}" has been exposed despite having a different type compared to the default value'
export const GET_METADATA_CAST_ERROR = 'Visitor {0}, Flag for key {1} has a different type with default value: Empty metadata object is returned {2}'
export const FLAG_METADATA = 'FLAG_METADATA'
export const NO_FLAG_METADATA = 'Visitor {0}, No Flags found for key {1}:  Empty metadata object is returned'
export const METADATA_SDK_NOT_READY = `Visitor {0}, Flag for key {1} Method Flag.metadata is deactivated while SDK status is NOT_READY: Empty metadata object is returned {2}
Learn more: ${JS_DOC_URL}#getting-flags-campaigns-metadata`
export const METADATA_PANIC_MODE = `Visitor {0}, Flag for key {1} Method Flag.metadata is deactivated while SDK status is PANIC: Empty metadata object is returned {2}
Learn more: ${PANIC_MODE_DOC_URL}`
export const AUTHENTICATE = 'AUTHENTICATE'
export const VISITOR_AUTHENTICATE = 'The visitor is authenticated with new visitor ID {0} anonymous ID {1}'
export const VISITOR_ALREADY_AUTHENTICATE = 'The visitor is already authenticated with visitor ID {0}'
export const METHOD_DEACTIVATED_BUCKETING_ERROR = 'Visitor {0}, Method {1} is deactivated on Bucketing mode'
export const VISITOR_AUTHENTICATE_VISITOR_ID_ERROR = `Visitor {0}, visitorId must not be null or empty
Learn more: ${JS_DOC_URL}#authenticate`
export const VISITOR_UNAUTHENTICATE = 'The visitor is unauthenticated with visitor ID {0}'
export const UNAUTHENTICATE = 'UNAUTHENTICATE'
export const FLAGSHIP_VISITOR_NOT_AUTHENTICATE = 'Visitor {0} is not authenticated yet'
export const ALLOCATION = 'ALLOCATION'
export const BUCKETING_VARIATION_CACHE = 'Visitor {0}, Variation {1} selected from cache.'
export const BUCKETING_NEW_ALLOCATION = 'Visitor {0}, Variation {1} selected with allocation {2}.'
export const LOOKUP_VISITOR_JSON_OBJECT_ERROR = `lookupVisitor method has loaded a bad format version ({0}) for visitor {1}.
Learn more: ${JS_DOC_URL}#managing-visitor-cache`
export const PROCESS_CACHE = 'CACHE'
export const VISITOR_CACHE_ERROR = 'visitor {0}. {1} threw an exception {2}'
export const HIT_CACHE_ERROR = '{0} threw an exception {1}'
export const VISITOR_CACHE_LOADED = 'Visitor {0}, visitor cache has been loaded from database: {1}'
export const VISITOR_CACHE_SAVED = 'Visitor {0}, visitor cache has been saved into database : {0}'
export const VISITOR_CACHE_FLUSHED = 'Visitor {0}, visitor cache has been flushed from database.'
export const HIT_CACHE_LOADED = 'Hits cache has been loaded from database: {0}'
export const HIT_CACHE_SAVED = 'Hit cache has been saved into database : {0}'
export const HIT_DATA_FLUSHED = 'The following hit keys have been flushed from database : {0}'
export const ALL_HITS_FLUSHED = 'All hits cache has been flushed from database'
export const BATCH_LOOP_STARTED = 'The Batch Loop has been started with a time interval of {0} ms'
export const TRACKING_MANAGER = 'TRACKING_MANAGER'
export const BATCH_LOOP_STOPPED = 'The Batch Loop has been stopped'
export const TRACKING_MANAGER_ERROR = '{0} Unexpected Error occurred {1}'
export const HIT_SENT_SUCCESS = '{0} has been sent : {1}'
export const ACTIVATE_HIT = 'ACTIVATE HIT'
export const BATCH_HIT = 'BATCH HIT'
export const DIRECT_HIT = 'HIT'
export const GET_THIRD_PARTY_SEGMENT = 'GET_THIRD_PARTY_SEGMENT'

export const CONSENT_NOT_SPECIFY_WARNING = 'Consent has not been specified. By default, consent is set to false, which may result in some features being deactivated.'
