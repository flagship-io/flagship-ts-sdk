import {
  ANONYMOUS_ID,
  BASE_API_URL,
  CUSTOMER_ENV_ID_API_ITEM,
  HEADER_APPLICATION_JSON,
  HEADER_CONTENT_TYPE,
  HEADER_X_API_KEY,
  HEADER_X_SDK_CLIENT,
  HEADER_X_SDK_VERSION,
  HIT_API_URL,
  PROCESS_SEND_ACTIVATE,
  PROCESS_SEND_HIT,
  SDK_LANGUAGE,
  SDK_VERSION,
  URL_ACTIVATE_MODIFICATION,
  VARIATION_GROUP_ID_API_ITEM,
  VARIATION_ID_API_ITEM,
  VISITOR_ID_API_ITEM
} from '../enum/FlagshipConstant'
import { HitAbstract } from '../hit/HitAbstract'
import { Modification } from '../model/Modification'
import { primitive } from '../types'
import { logError } from '../utils/utils'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { TrackingManagerAbstract } from './TrackingManagerAbstract'

export class TrackingManager extends TrackingManagerAbstract {
  public sendActive (
    visitor: VisitorAbstract,
    modification: Modification
  ): Promise<void> {
    const headers = {
      [HEADER_X_API_KEY]: `${this.config.apiKey}`,
      [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
      [HEADER_X_SDK_VERSION]: SDK_VERSION,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const url = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`

    const postData:Record<string, primitive|null> = {
      [VISITOR_ID_API_ITEM]: visitor.visitorId,
      [VARIATION_ID_API_ITEM]: modification.variationId,
      [VARIATION_GROUP_ID_API_ITEM]: modification.variationGroupId,
      [CUSTOMER_ENV_ID_API_ITEM]: `${this.config.envId}`
    }

    if (visitor.visitorId && visitor.anonymousId) {
      postData[VISITOR_ID_API_ITEM] = visitor.visitorId
      postData[ANONYMOUS_ID] = visitor.anonymousId
    } else {
      postData[VISITOR_ID_API_ITEM] = visitor.anonymousId || visitor.visitorId
      postData[ANONYMOUS_ID] = null
    }

    return new Promise<void>((resolve, reject) => {
      this.httpClient
        .postAsync(url, {
          headers: headers,
          timeout: this.config.timeout,
          body: postData
        })
        .then(() => {
          resolve()
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  public sendHit (hit: HitAbstract): Promise<void> {
    const headers = {
      [HEADER_X_API_KEY]: `${this.config.apiKey}`,
      [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
      [HEADER_X_SDK_VERSION]: SDK_VERSION,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }
    return new Promise((resolve, reject) => {
      this.httpClient
        .postAsync(HIT_API_URL, {
          headers: headers,
          timeout: this.config.timeout,
          body: hit.toApiKeys()
        })
        .then(() => {
          resolve()
        })
        .catch((error) => {
          reject(error)
        })
    })
  }
}
