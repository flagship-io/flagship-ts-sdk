import {
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
  SDK_LANGUAGE,
  SDK_VERSION,
  T_API_ITEM,
  URL_ACTIVATE_MODIFICATION,
  VISITOR_ID_API_ITEM
} from '../enum/FlagshipConstant'
import { HitType } from '../enum/HitType'
import { EventCategory } from '../hit/index'
import { HitAbstract } from '../hit/HitAbstract'
import { primitive } from '../types'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { TrackingManagerAbstract } from './TrackingManagerAbstract'

export class TrackingManager extends TrackingManagerAbstract {
  public async sendConsentHit (visitor: VisitorAbstract): Promise<void> {
    const postBody: Record<string, unknown> = {
      [T_API_ITEM]: HitType.EVENT,
      [EVENT_LABEL_API_ITEM]: `${SDK_LANGUAGE.name}:${visitor.hasConsented}`,
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
    flagData: Record<string, primitive | null|undefined>
  ): Promise<void> {
    const headers = {
      [HEADER_X_API_KEY]: `${this.config.apiKey}`,
      [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
      [HEADER_X_SDK_VERSION]: SDK_VERSION,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    const url = `${BASE_API_URL}${URL_ACTIVATE_MODIFICATION}`

    await this.httpClient.postAsync(url, {
      headers: headers,
      timeout: this.config.timeout,
      body: flagData
    })
  }

  public async sendHit (hit: HitAbstract): Promise<void> {
    const headers = {
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }

    await this.httpClient.postAsync(HIT_API_URL, {
      headers: headers,
      timeout: this.config.timeout,
      body: hit.toApiKeys()
    })
  }
}
