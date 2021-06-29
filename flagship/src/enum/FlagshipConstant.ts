/**
 * SDK language
 */

export const SDK_LANGUAGE = "TypeScript";

/**
 * Decision api base url
 */
export const BASE_API_URL = "https://decision.flagship.io/v2/";
export const HIT_API_URL = "https://ariane.abtasty.com";
export const URL_CAMPAIGNS = "/campaigns";
export const URL_ACTIVATE_MODIFICATION = "activate";

export const EXPOSE_ALL_KEYS = "exposeAllKeys";

/**
 * SDK version
 */
export const SDK_VERSION = "v1";

/**
 * Message Info
 */

export const SDK_STARTED_INFO = "Flagship SDK (version: %s) READY";
export const FLAGSHIP_SDK = "Flagship SDK";

/**
 * Message Error
 */
export const INITIALIZATION_PARAM_ERROR =
  "Params 'envId' and 'apiKey' must not be null or empty.";
export const ERROR = "error";
export const CONTEXT_PARAM_ERROR =
  "params 'key' must be a non null String, and 'value' must be one of the following types , Number, Boolean";
export const GET_MODIFICATION_CAST_ERROR =
  "Modification for key '%s' has a different type. Default value is returned.";
export const GET_MODIFICATION_MISSING_ERROR =
  "No modification for key '%s'. Default value is returned.";
export const GET_MODIFICATION_KEY_ERROR =
  "Key '%s' must not be null. Default value is returned.";
export const GET_MODIFICATION_ERROR = "No modification for key '%s'.";
export const DECISION_MANAGER_MISSING_ERROR =
  "decisionManager must not be null.";
export const TRACKER_MANAGER_MISSING_ERROR =
  "trackerManager must not be null.";
export const CURL_LIBRARY_IS_NOT_LOADED = "curl library is not loaded";
export const TYPE_ERROR = " '%s' must be a '%s'";

//Process
export const PROCESS = "process";
export const PROCESS_INITIALIZATION = "INITIALIZATION";
export const PROCESS_UPDATE_CONTEXT = "UPDATE CONTEXT";
export const PROCESS_GET_MODIFICATION = "GET MODIFICATION";
export const PROCESS_GET_MODIFICATION_INFO = "GET MODIFICATION INFO";
export const PROCESS_NEW_VISITOR = "NEW VISITOR";
export const PROCESS_ACTIVE_MODIFICATION = "ACTIVE MODIFICATION";
export const PROCESS_SYNCHRONIZED_MODIFICATION =
  "SYNCHRONIZED MODIFICATION";
export const PROCESS_SEND_HIT = "SEND HIT";
