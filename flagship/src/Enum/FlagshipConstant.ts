class FlagshipConstant {

    /**
     * Default request timeout in second
     */
     static readonly REQUEST_TIME_OUT:number = 2;

     /**
      * SDK language
      */
     readonly SDK_LANGUAGE:string = "TypeScript";
 
     /**
      * Decision api base url
      */
     readonly BASE_API_URL:string  = "https://decision.flagship.io/v2";
     readonly HIT_API_URL:string   = "https://ariane.abtasty.com";
     readonly URL_CAMPAIGNS:string = 'campaigns';
     readonly URL_ACTIVATE_MODIFICATION:string = 'activate';
 
     readonly EXPOSE_ALL_KEYS:string = "exposeAllKeys";
 
     /**
      * SDK version
      */
     readonly SDK_VERSION:string = "v1";
     
     /**
      * Message Info
      */

     readonly SDK_STARTED_INFO:string = "Flagship SDK (version: %s) READY";
     readonly FLAGSHIP_SDK:string   = "Flagship SDK";
     
     /**
      * Message Error
      */
     readonly INITIALIZATION_PARAM_ERROR:string     = "Params 'envId' and 'apiKey' must not be null or empty.";
     readonly ERROR:string                          = "error";
     readonly CONTEXT_PARAM_ERROR:string            = "params 'key' must be a non null String, and 'value' must be one of the following types : String, Number, Boolean";
     readonly GET_MODIFICATION_CAST_ERROR:string    = "Modification for key '%s' has a different type. Default value is returned.";
     readonly GET_MODIFICATION_MISSING_ERROR:string = "No modification for key '%s'. Default value is returned.";
     readonly GET_MODIFICATION_KEY_ERROR:string     = "Key '%s' must not be null. Default value is returned.";
     readonly GET_MODIFICATION_ERROR:string         = "No modification for key '%s'.";
     readonly DECISION_MANAGER_MISSING_ERROR:string = "decisionManager must not be null.";
     readonly TRACKER_MANAGER_MISSING_ERROR:string  = "trackerManager must not be null.";
     readonly CURL_LIBRARY_IS_NOT_LOADED:string     = 'curl library is not loaded';
     readonly TYPE_ERROR:string   = " '%s' must be a '%s'";
 
     
 
     //Process
     readonly PROCESS:string                           = 'process';
     readonly PROCESS_INITIALIZATION:string            = 'INITIALIZATION';
     readonly PROCESS_UPDATE_CONTEXT:string            = 'UPDATE CONTEXT';
     readonly PROCESS_GET_MODIFICATION:string          = 'GET MODIFICATION';
     readonly PROCESS_GET_MODIFICATION_INFO:string     = 'GET MODIFICATION INFO';
     readonly PROCESS_NEW_VISITOR:string               = 'NEW VISITOR';
     readonly PROCESS_ACTIVE_MODIFICATION:string       = 'ACTIVE MODIFICATION';
     readonly PROCESS_SYNCHRONIZED_MODIFICATION:string = "SYNCHRONIZED MODIFICATION";
     readonly PROCESS_SEND_HIT:string            = "SEND HIT";
}