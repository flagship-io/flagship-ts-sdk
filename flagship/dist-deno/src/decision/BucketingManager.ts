import { IFlagshipConfig } from '../config/index.ts'
import { BUCKETING_API_CONTEXT_URL, BUCKETING_API_URL, FlagshipStatus, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, REQUEST_TIME_OUT, SDK_LANGUAGE, SDK_VERSION } from '../enum/index.ts'
import { primitive } from '../types.ts'
import { IHttpClient, IHttpResponse } from '../utils/HttpClient.ts'
import { MurmurHash } from '../utils/MurmurHash.ts'
import { logError, logInfo, sprintf } from '../utils/utils.ts'
import { VisitorAbstract } from '../visitor/VisitorAbstract.ts'
import { BucketingDTO, Targetings, VariationGroupDTO } from './api/bucketingDTO.ts'
import { CampaignDTO, VariationDTO } from './api/models.ts'
import { DecisionManager } from './DecisionManager.ts'

export class BucketingManager extends DecisionManager {
  private _bucketingContent!: BucketingDTO;
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

  private finishLoop (response: IHttpResponse) {
    if (response.status === 200) {
      this._bucketingContent = response.body
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
      this.updateFlagshipStatus(FlagshipStatus.READY)
    }

    if (typeof this.config.onBucketingSuccess === 'function') {
      this.config.onBucketingSuccess({ status: response.status, payload: this._bucketingContent })
    }

    this._isPooling = false
  }

  async startPolling (): Promise<void> {
    const timeout = (this.config.pollingInterval ?? REQUEST_TIME_OUT) * 1000
    logInfo(this.config, 'Bucketing polling starts', 'startPolling')
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
      this.updateFlagshipStatus(FlagshipStatus.POLLING)
    }
    try {
      const url = sprintf(BUCKETING_API_URL, this.config.envId)
      const headers: Record<string, string> = {
        [HEADER_X_API_KEY]: `${this.config.apiKey}`,
        [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
        [HEADER_X_SDK_VERSION]: SDK_VERSION,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
      }

      if (this._lastModified) {
        headers['if-modified-since'] = this._lastModified
      }

      const response = await this._httpClient.getAsync(url, { headers, timeout: this.config.timeout })

      this.finishLoop(response)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this._isPooling = false
      logError(this.config, error, 'startPolling')
      if (this._isFirstPooling) {
        this.updateFlagshipStatus(FlagshipStatus.NOT_INITIALIZED)
      }
      if (typeof this.config.onBucketingFail === 'function') {
        this.config.onBucketingFail(new Error(error))
      }
    }
  }

  public stopPolling (): void {
    clearInterval(this._intervalID)
    this._isPooling = false
    logInfo(this.config, 'Bucketing polling stopped', 'stopPolling')
  }

  private async sendContext (visitor: VisitorAbstract): Promise<void> {
    try {
      if (Object.keys(visitor.context).length <= 3) {
        return
      }
      const url = sprintf(BUCKETING_API_CONTEXT_URL, this.config.envId)
      const headers: Record<string, string> = {
        [HEADER_X_API_KEY]: `${this.config.apiKey}`,
        [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE.name,
        [HEADER_X_SDK_VERSION]: SDK_VERSION,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
      }
      const body = {
        visitorId: visitor.visitorId,
        type: 'CONTEXT',
        data: visitor.context
      }
      await this._httpClient.postAsync(url, { headers, body, timeout: this.config.timeout })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logError(this.config, error.message || error, 'sendContext')
    }
  }

  async getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[]|null> {
    if (!this._bucketingContent) {
      return null
    }
    if (this._bucketingContent.panic) {
      this.panic = true
      return []
    }
    this.panic = false

    if (!this._bucketingContent.campaigns) {
      return null
    }

    this.sendContext(visitor)

    const visitorCampaigns: CampaignDTO[] = []

    this._bucketingContent.campaigns.forEach(campaign => {
      const currentCampaigns = this.getVisitorCampaigns(campaign.variationGroups, campaign.id, campaign.type, visitor)
      if (currentCampaigns) {
        currentCampaigns.slug = campaign.slug
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
          variation: variation,
          variationGroupId: variationGroup.id,
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
        return {
          id: newVariation.id,
          modifications: newVariation.modifications,
          reference: newVariation.reference
        }
      }

      if (variation.allocation === undefined) {
        continue
      }
      totalAllocation += variation.allocation

      if (hashAllocation <= totalAllocation) {
        return {
          id: variation.id,
          modifications: variation.modifications,
          reference: variation.reference
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
