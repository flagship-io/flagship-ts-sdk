import { ALLOCATION, BUCKETING_NEW_ALLOCATION, BUCKETING_VARIATION_CACHE, GET_THIRD_PARTY_SEGMENT, POLLING_EVENT_300, POLLING_EVENT_FAILED, THIRD_PARTY_SEGMENT_URL } from '../enum/FlagshipConstant.ts'
import { IFlagshipConfig } from '../config/index.ts'
import { BUCKETING_API_URL, BUCKETING_POOLING_STARTED, BUCKETING_POOLING_STOPPED, FSSdkStatus, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, LogLevel, POLLING_EVENT_200, PROCESS_BUCKETING, SDK_INFO } from '../enum/index.ts'
import { Segment } from '../hit/Segment.ts'
import { CampaignDTO, ThirdPartySegment, TroubleshootingLabel, VariationDTO, primitive } from '../types.ts'
import { IHttpClient, IHttpResponse } from '../utils/HttpClient.ts'
import { MurmurHash } from '../utils/MurmurHash.ts'
import { errorFormat, logDebug, logDebugSprintf, logError, logInfo, sprintf } from '../utils/utils.ts'
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts'
import { Targetings, VariationGroupDTO } from './api/bucketingDTO.ts'
import { DecisionManager } from './DecisionManager.ts'
import { Troubleshooting } from '../hit/Troubleshooting.ts'

export class BucketingManager extends DecisionManager {
  private _lastModified!: string
  private _isPooling!: boolean
  private _murmurHash: MurmurHash
  private _isFirstPooling: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _intervalID!: any

  public constructor (httpClient: IHttpClient, config: IFlagshipConfig, murmurHash: MurmurHash) {
    super(httpClient, config)
    this._murmurHash = murmurHash
    this._isFirstPooling = true
    if (config.initialBucketing) {
      this._bucketingContent = config.initialBucketing
    }
  }

  private finishLoop (params: {response: IHttpResponse, headers: Record<string, string>, url: string, now: number}) {
    const { response, headers, url, now } = params
    if (response.status === 200) {
      logDebugSprintf(this.config, PROCESS_BUCKETING, POLLING_EVENT_200, response.body)
      this._bucketingContent = response.body
      this._lastBucketingTimestamp = new Date().toISOString()
      const troubleshootingHit = new Troubleshooting({
        visitorId: this.flagshipInstanceId,
        flagshipInstanceId: this.flagshipInstanceId,
        label: TroubleshootingLabel.SDK_BUCKETING_FILE,
        traffic: 0,
        logLevel: LogLevel.INFO,
        config: this.config,
        httpRequestHeaders: headers,
        httpRequestMethod: 'POST',
        httpRequestUrl: url,
        httpResponseBody: response?.body,
        httpResponseHeaders: response?.headers,
        httpResponseCode: response?.status,
        httpResponseTime: Date.now() - now
      })
      this.trackingManager.sendTroubleshootingHit(troubleshootingHit)
    } else if (response.status === 304) {
      logDebug(this.config, POLLING_EVENT_300, PROCESS_BUCKETING)
    }

    if (response.headers && response.headers['last-modified']) {
      const lastModified = response.headers['last-modified']

      if (this._lastModified !== lastModified && this.config.onBucketingUpdated) {
        this.config.onBucketingUpdated(new Date(lastModified))
      }
      this._lastModified = lastModified
    }

    if (this._isFirstPooling) {
      this._isFirstPooling = false
      this.updateFlagshipStatus(FSSdkStatus.SDK_INITIALIZED)
    }

    if (typeof this.config.onBucketingSuccess === 'function') {
      this.config.onBucketingSuccess({ status: response.status, payload: this._bucketingContent })
    }

    this._isPooling = false
  }

  async startPolling (): Promise<void> {
    const timeout = this.config.pollingInterval as number * 1000
    logInfo(this.config, BUCKETING_POOLING_STARTED, PROCESS_BUCKETING)
    await this.polling()
    if (timeout === 0) {
      return
    }
    this._intervalID = setInterval(() => {
      this.polling()
    }, timeout)
  }

  private async polling () {
    if (this._isPooling) {
      return
    }
    this._isPooling = true
    if (this._isFirstPooling) {
      this.updateFlagshipStatus(FSSdkStatus.SDK_INITIALIZING)
    }
    const url = sprintf(BUCKETING_API_URL, this.config.envId)
    const headers: Record<string, string> = {
      [HEADER_X_API_KEY]: `${this.config.apiKey}`,
      [HEADER_X_SDK_CLIENT]: SDK_INFO.name,
      [HEADER_X_SDK_VERSION]: SDK_INFO.version,
      [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
    }
    const now = Date.now()
    try {
      if (this._lastModified) {
        headers['if-modified-since'] = this._lastModified
      }

      const response = await this._httpClient.getAsync(url, {
        headers,
        timeout: this.config.timeout,
        nextFetchConfig: this.config.nextFetchConfig
      })

      this.finishLoop({ response, headers, url, now })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this._isPooling = false
      logError(this.config, errorFormat(POLLING_EVENT_FAILED, {
        url,
        headers,
        nextFetchConfig: this.config.nextFetchConfig,
        method: 'GET',
        duration: Date.now() - now
      }), PROCESS_BUCKETING)
      if (this._isFirstPooling) {
        this.updateFlagshipStatus(FSSdkStatus.SDK_NOT_INITIALIZED)
      }
      if (typeof this.config.onBucketingFail === 'function') {
        this.config.onBucketingFail(new Error(error))
      }
      const troubleshootingHit = new Troubleshooting({
        visitorId: this.flagshipInstanceId,
        flagshipInstanceId: this.flagshipInstanceId,
        label: TroubleshootingLabel.SDK_BUCKETING_FILE_ERROR,
        traffic: 0,
        logLevel: LogLevel.INFO,
        config: this.config,
        httpRequestHeaders: headers,
        httpRequestMethod: 'GET',
        httpRequestUrl: url,
        httpResponseBody: error?.message,
        httpResponseHeaders: error?.headers,
        httpResponseCode: error?.statusCode,
        httpResponseTime: Date.now() - now
      })
      this.trackingManager.sendTroubleshootingHit(troubleshootingHit)
    }
  }

  public stopPolling (): void {
    clearInterval(this._intervalID)
    this._isPooling = false
    logInfo(this.config, BUCKETING_POOLING_STOPPED, PROCESS_BUCKETING)
  }

  private async sendContext (visitor: VisitorAbstract): Promise<void> {
    try {
      if (Object.keys(visitor.context).length <= 3 || !visitor.hasConsented) {
        return
      }
      const SegmentHit = new Segment({
        context: visitor.context,
        visitorId: visitor.visitorId,
        anonymousId: visitor.anonymousId as string
      })

      await visitor.sendHit(SegmentHit)

      const hitTroubleshooting = new Troubleshooting({
        label: TroubleshootingLabel.VISITOR_SEND_HIT,
        logLevel: LogLevel.INFO,
        traffic: visitor.traffic || 0,
        visitorId: visitor.visitorId,
        visitorSessionId: visitor.instanceId,
        flagshipInstanceId: visitor.sdkInitialData?.instanceId,
        anonymousId: visitor.anonymousId,
        config: this.config,
        hitContent: SegmentHit.toApiKeys()
      })

      visitor.segmentHitTroubleshooting = hitTroubleshooting

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logError(this.config, error.message || error, 'sendContext')
    }
  }

  public async getThirdPartySegment (visitorId:string): Promise<Record<string, primitive>> {
    const url = sprintf(THIRD_PARTY_SEGMENT_URL, this.config.envId, visitorId)
    const now = Date.now()
    const contexts:Record<string, primitive> = {}
    try {
      const response = await this._httpClient.getAsync(url, {
        nextFetchConfig: this.config.nextFetchConfig
      })
      const content:ThirdPartySegment[] = response.body
      if (Array.isArray(content)) {
        for (const item of content) {
          contexts[`${item.partner}::${item.segment}`] = item.value
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logError(this.config, errorFormat(error.message || error, {
        url,
        nextFetchConfig: this.config.nextFetchConfig,
        duration: Date.now() - now
      }), GET_THIRD_PARTY_SEGMENT)
    }
    return contexts
  }

  async getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[]|null> {
    if (!this._bucketingContent) {
      return null
    }

    const troubleshooting = this._bucketingContent?.accountSettings?.troubleshooting
    this.troubleshooting = undefined
    if (troubleshooting) {
      this.troubleshooting = {
        startDate: new Date(troubleshooting.startDate),
        endDate: new Date(troubleshooting.endDate),
        timezone: troubleshooting.timezone,
        traffic: troubleshooting.traffic
      }
    }

    if (this._bucketingContent.panic) {
      this.panic = true
      return []
    }
    this.panic = false

    if (!this._bucketingContent.campaigns) {
      return null
    }

    if (this.config.fetchThirdPartyData) {
      const thirdPartySegments = await this.getThirdPartySegment(visitor.visitorId)
      visitor.updateContext(thirdPartySegments)
    }

    await this.sendContext(visitor)

    const visitorCampaigns: CampaignDTO[] = []

    this._bucketingContent.campaigns.forEach(campaign => {
      const currentCampaigns = this.getVisitorCampaigns(campaign.variationGroups, campaign.id, campaign.type, visitor)
      if (currentCampaigns) {
        currentCampaigns.slug = campaign.slug ?? null
        currentCampaigns.name = campaign.name
        visitorCampaigns.push(currentCampaigns)
      }
    })
    return visitorCampaigns
  }

  private getVisitorCampaigns (variationGroups: VariationGroupDTO[], campaignId: string, campaignType: string, visitor: VisitorAbstract): CampaignDTO | null {
    for (const variationGroup of variationGroups) {
      const check = this.isMatchTargeting(variationGroup, visitor)
      if (check) {
        const variation = this.getVariation(
          variationGroup,
          visitor
        )
        if (!variation) {
          return null
        }
        return {
          id: campaignId,
          variation,
          variationGroupId: variationGroup.id,
          variationGroupName: variationGroup.name,
          type: campaignType
        }
      }
    }
    return null
  }

  private getVariation (variationGroup: VariationGroupDTO, visitor: VisitorAbstract): VariationDTO | null {
    const hash = this._murmurHash.murmurHash3Int32(variationGroup.id + visitor.visitorId)
    const hashAllocation = hash % 100
    let totalAllocation = 0

    for (const variation of variationGroup.variations) {
      const assignmentsHistory = visitor.visitorCache?.data?.assignmentsHistory
      const cacheVariationId = assignmentsHistory ? assignmentsHistory[variationGroup.id] : null
      if (cacheVariationId) {
        const newVariation = variationGroup.variations.find(x => x.id === cacheVariationId)
        if (!newVariation) {
          continue
        }
        logDebugSprintf(this.config, ALLOCATION, BUCKETING_VARIATION_CACHE, visitor.visitorId, newVariation.id)
        return {
          id: newVariation.id,
          name: newVariation.name,
          modifications: newVariation.modifications,
          reference: newVariation.reference
        }
      }

      if (variation.allocation === undefined) {
        continue
      }
      totalAllocation += variation.allocation

      if (hashAllocation <= totalAllocation) {
        logDebugSprintf(this.config, ALLOCATION, BUCKETING_NEW_ALLOCATION, visitor.visitorId, variation.id, totalAllocation)
        return {
          id: variation.id,
          modifications: variation.modifications,
          reference: variation.reference,
          name: variation.name
        }
      }
    }
    return null
  }

  private isMatchTargeting (variationGroup: VariationGroupDTO, visitor: VisitorAbstract): boolean {
    if (!variationGroup || !variationGroup.targeting || !variationGroup.targeting.targetingGroups) {
      return false
    }
    return variationGroup.targeting.targetingGroups.some(
      targetingGroup => this.checkAndTargeting(targetingGroup.targetings, visitor)
    )
  }

  private isANDListOperator (operator: string): boolean {
    return ['NOT_EQUALS', 'NOT_CONTAINS'].includes(operator)
  }

  private checkAndTargeting (targetings: Targetings[], visitor: VisitorAbstract): boolean {
    let contextValue: primitive
    let check = false

    for (const { key, value, operator } of targetings) {
      if (operator === 'EXISTS') {
        if (key in visitor.context) {
          check = true
          continue
        }
        check = false
        break
      }

      if (operator === 'NOT_EXISTS') {
        if (key in visitor.context) {
          check = false
          break
        }
        check = true
        continue
      }

      if (key === 'fs_all_users') {
        check = true
        continue
      }
      if (key === 'fs_users') {
        contextValue = visitor.visitorId
      } else {
        if (!(key in visitor.context)) {
          check = false
          break
        }
        contextValue = visitor.context[key]
      }

      check = this.testOperator(operator, contextValue, value)

      if (!check) {
        break
      }
    }
    return check
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private testListOperatorLoop (operator: string, contextValue: primitive, value: any[], initialCheck: boolean) {
    let check = initialCheck
    for (const v of value) {
      check = this.testOperator(operator, contextValue, v)
      if (check !== initialCheck) {
        break
      }
    }
    return check
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private testListOperator (operator: string, contextValue: primitive, value: any[]): boolean {
    const andOperator = this.isANDListOperator(operator)
    if (andOperator) {
      return this.testListOperatorLoop(operator, contextValue, value, true)
    }
    return this.testListOperatorLoop(operator, contextValue, value, false)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private testOperator (operator: string, contextValue: primitive, value: any): boolean {
    let check: boolean
    if (Array.isArray(value)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.testListOperator(operator, contextValue, value)
    }
    switch (operator) {
      case 'EQUALS':
        check = contextValue === value
        break
      case 'NOT_EQUALS':
        check = contextValue !== value
        break
      case 'CONTAINS':
        check = contextValue.toString().includes(value.toString())
        break
      case 'NOT_CONTAINS':
        check = !contextValue.toString().includes(value.toString())
        break
      case 'GREATER_THAN':
        check = contextValue > value
        break
      case 'LOWER_THAN':
        check = contextValue < value
        break
      case 'GREATER_THAN_OR_EQUALS':
        check = contextValue >= value
        break
      case 'LOWER_THAN_OR_EQUALS':
        check = contextValue <= value
        break
      case 'STARTS_WITH':
        check = contextValue.toString().startsWith(value.toString())
        break
      case 'ENDS_WITH':
        check = contextValue.toString().endsWith(value.toString())
        break
      default:
        check = false
        break
    }

    return check
  }
}
