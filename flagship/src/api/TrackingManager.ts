import {
  BASE_API_URL,
  CUSTOMER_ENV_ID_API_ITEM,
  HEADER_APPLICATION_JSON,
  HEADER_CONTENT_TYPE,
  HEADER_X_API_KEY,
  HEADER_X_SDK_CLIENT,
  HEADER_X_SDK_VERSION,
  HIT_API_URL,
  SDK_LANGUAGE,
  SDK_VERSION,
  URL_ACTIVATE_MODIFICATION,
  VARIATION_GROUP_ID_API_ITEM,
  VARIATION_ID_API_ITEM,
  VISITOR_ID_API_ITEM,
} from "../enum/FlagshipConstant.ts";
import { HitAbstract } from "../hit/HitAbstract.ts";
import { Modification } from "../model/Modification.ts";
import { logError } from "../utils/utils.ts";
import { Visitor } from "../visitor/Visitor.ts";
import { TrackingManagerAbstract } from "./TrackingManagerAbstract.ts";

export class TrackingManager extends TrackingManagerAbstract {
  public sendActive(visitor: Visitor, modification: Modification): void {
    try {
      const headers = {
        [HEADER_X_API_KEY]: `${this.config.apiKey}`,
        [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
        [HEADER_X_SDK_VERSION]: SDK_VERSION,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON,
      };

      const url = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`;

      const postData = {
        [VISITOR_ID_API_ITEM]: visitor.visitorId,
        [VARIATION_ID_API_ITEM]: modification.variationId,
        [VARIATION_GROUP_ID_API_ITEM]: modification.variationGroupId,
        [CUSTOMER_ENV_ID_API_ITEM]: this.config.envId,
      };

      this.httpClient
        .postAsync(url, {
          headers: headers,
          timeout: this.config.timeout,
          body: postData,
        })
        .then((response) => {
          if (response.status >= 400) {
            logError(this.config, response.body, "sendActive");
          }
        });
    } catch (error) {
      logError(this.config, error.message, "sendActive");
    }
  }

  public sendHit(hit: HitAbstract): void {
    try {
      const headers = {
        [HEADER_X_API_KEY]: `${this.config.apiKey}`,
        [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
        [HEADER_X_SDK_VERSION]: SDK_VERSION,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON,
      };

      this.httpClient
        .postAsync(HIT_API_URL, {
          headers: headers,
          timeout: this.config.timeout,
          body: hit.toApiKeys(),
        })
        .then((response) => {
          if (response.status >= 400) {
            logError(this.config, response.body, "sendHit");
          }
        })
        .catch((error) => {
          logError(this.config, error.message, "sendHit");
        });
    } catch (error) {
      logError(this.config, error.message, "sendHit");
    }
  }
}
