import {
  ANONYMOUS_ID,
  BASE_API_URL,
  CUSTOMER_ENV_ID_API_ITEM,
  CUSTOMER_UID,
  DS_API_ITEM,
  EVENT_ACTION_API_ITEM,
  EVENT_CATEGORY_API_ITEM,
  EVENT_LABEL_API_ITEM,
  HEADER_APPLICATION_JSON,
  HEADER_CONTENT_TYPE,
  HEADER_X_API_KEY,
  HEADER_X_SDK_CLIENT,
  HEADER_X_SDK_VERSION,
  HIT_API_URL,
  HIT_CONSENT_URL,
  SDK_APP,
  SDK_INFO,
  T_API_ITEM,
  URL_ACTIVATE_MODIFICATION,
  VARIATION_GROUP_ID_API_ITEM,
  VARIATION_ID_API_ITEM,
  VISITOR_ID_API_ITEM
} from '../enum/FlagshipConstant.ts'
import { HitType } from '../enum/HitType.ts'
import { EventCategory } from '../hit/index.ts'
import { HitAbstract } from '../hit/HitAbstract.ts'
import { FlagDTO, primitive } from '../types.ts'
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts'
import { TrackingManagerAbstract } from './TrackingManagerAbstract.ts'

export class TrackingManager extends TrackingManagerAbstract {
  public async sendConsentHit (visitor: VisitorAbstract): Promise<void> {
    const postBody: Record<string, unknown> = {
      [T_API_ITEM]: HitType.EVENT,
      [EVENT_LABEL_API_ITEM]: `${SDK_INFO.name}:${visitor.hasConsented}`,
      [EVENT_ACTION_API_ITEM]: 'fs_consent',
      [EVENT_CATEGORY_API_ITEM]: EventCategory.USER_ENGAGEMENT,
      [CUSTOMER_ENV_ID_API_ITEM]: this.config.envId,
      [DS_API_ITEM]: SDK_APP
    }

    if (visitor.visitorId && visitor.anonymousId) {
      postBody[VISITOR_ID_API_ITEM] = visitor.anonymousId
      postBody[CUSTOMER_UID] = visitor.visitorId
    } else {
      postBody[VISITOR_ID_API_ITEM] = visitor.anonymousId || visitor.visitorId
      postBody[CUSTOMER_UID] = null
    }

    const headers = {
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    await this.httpClient.postAsync(HIT_CONSENT_URL, {
      headers,
      timeout: this.config.timeout,
      body: postBody
    })
  }

  public async sendActive (
    visitor: VisitorAbstract,
    modification: FlagDTO
  ): Promise<void> {
    const headers = {
      [HEADER_X_API_KEY]: `${this.config.apiKey}`,
      [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
      [HEADER_X_SDK_VERSION]: SDK_INFO.version,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const url = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`

    const postData: Record<string, primitive | null> = {
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

    await this.httpClient.postAsync(url, {
      headers,
      timeout: this.config.timeout,
      body: postData
    })
  }

  public async sendHit (hit: HitAbstract): Promise<void> {
    const headers = {
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    await this.httpClient.postAsync(HIT_API_URL, {
      headers,
      timeout: this.config.timeout,
      body: hit.toApiKeys()
    })
  }
}
