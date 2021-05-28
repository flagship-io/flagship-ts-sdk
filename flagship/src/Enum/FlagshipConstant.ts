/**
 * SDK language
 */

export const SDK_LANGUAGE: string = "TypeScript";

/**
 * Decision api base url
 */
export const BASE_API_URL: string = "https://decision.flagship.io/v2/";
export const HIT_API_URL: string = "https://ariane.abtasty.com";
export const URL_CAMPAIGNS: string = "/campaigns";
export const URL_ACTIVATE_MODIFICATION: string = "activate";

export const EXPOSE_ALL_KEYS: string = "exposeAllKeys";

/**
 * SDK version
 */
export const SDK_VERSION: string = "v1";

/**
 * Message Info
 */

export const SDK_STARTED_INFO: string = "Flagship SDK (version: %s) READY";
export const FLAGSHIP_SDK: string = "Flagship SDK";

/**
 * Message Error
 */
export const INITIALIZATION_PARAM_ERROR: string =
  "Params 'envId' and 'apiKey' must not be null or empty.";
export const ERROR: string = "error";
export const CONTEXT_PARAM_ERROR: string =
  "params 'key' must be a non null String, and 'value' must be one of the following types : String, Number, Boolean";
export const GET_MODIFICATION_CAST_ERROR: string =
  "Modification for key '%s' has a different type. Default value is returned.";
export const GET_MODIFICATION_MISSING_ERROR: string =
  "No modification for key '%s'. Default value is returned.";
export const GET_MODIFICATION_KEY_ERROR: string =
  "Key '%s' must not be null. Default value is returned.";
export const GET_MODIFICATION_ERROR: string = "No modification for key '%s'.";
export const DECISION_MANAGER_MISSING_ERROR: string =
  "decisionManager must not be null.";
export const TRACKER_MANAGER_MISSING_ERROR: string =
  "trackerManager must not be null.";
export const CURL_LIBRARY_IS_NOT_LOADED: string = "curl library is not loaded";
export const TYPE_ERROR: string = " '%s' must be a '%s'";

//Process
export const PROCESS: string = "process";
export const PROCESS_INITIALIZATION: string = "INITIALIZATION";
export const PROCESS_UPDATE_CONTEXT: string = "UPDATE CONTEXT";
export const PROCESS_GET_MODIFICATION: string = "GET MODIFICATION";
export const PROCESS_GET_MODIFICATION_INFO: string = "GET MODIFICATION INFO";
export const PROCESS_NEW_VISITOR: string = "NEW VISITOR";
export const PROCESS_ACTIVE_MODIFICATION: string = "ACTIVE MODIFICATION";
export const PROCESS_SYNCHRONIZED_MODIFICATION: string =
  "SYNCHRONIZED MODIFICATION";
export const PROCESS_SEND_HIT: string = "SEND HIT";
