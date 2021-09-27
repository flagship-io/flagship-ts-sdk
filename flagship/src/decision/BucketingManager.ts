import { IFlagshipConfig } from '../config/index'
import { BUCKETING_API_CONTEXT_URL, BUCKETING_API_URL, FlagshipStatus, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, REQUEST_TIME_OUT, SDK_LANGUAGE, SDK_VERSION } from '../enum/index'
import { primitive } from '../types'
import { IHttpClient, IHttpResponse } from '../utils/HttpClient'
import { MurmurHash } from '../utils/MurmurHash'
import { logError, logInfo, sprintf } from '../utils/utils'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { BucketingDTO, Targetings, VariationGroupDTO } from './api/bucketingDTO'
import { CampaignDTO, VariationDTO } from './api/models'
import { DecisionManager } from './DecisionManager'

export class BucketingManager extends DecisionManager {
  private _bucketingContent!:BucketingDTO;
  private _lastModified!:string
  private _isPooling!:boolean
  private _murmurHash:MurmurHash
  private _isFirstPooling:boolean
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

  public startPolling ():void {
    const timeout = (this.config.pollingInterval ?? REQUEST_TIME_OUT) * 1000
    logInfo(this.config, 'Bucketing polling starts', 'startPolling')
    this.polling()
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
      const headers:Record<string, string> = {
        [HEADER_X_API_KEY]: `${this.config.apiKey}`,
        [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
        [HEADER_X_SDK_VERSION]: SDK_VERSION,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
      }

      if (this._lastModified) {
        headers['if-modified-since'] = this._lastModified
      }

      const response = await this._httpClient.getAsync(url, { headers })

      this.finishLoop(response)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      this._isPooling = false
      logError(this.config, error, 'startPolling dd')
      if (this._isFirstPooling) {
        this.updateFlagshipStatus(FlagshipStatus.NOT_INITIALIZED)
      }
      if (typeof this.config.onBucketingFail === 'function') {
        this.config.onBucketingFail(new Error(error))
      }
    }
  }

  public stopPolling ():void {
    clearInterval(this._intervalID)
    this._isPooling = false
    logInfo(this.config, 'Bucketing polling stopped', 'stopPolling')
  }

  private async sendContext (visitor: VisitorAbstract):Promise<void> {
    try {
      const url = sprintf(BUCKETING_API_CONTEXT_URL, this.config.envId)
      const headers:Record<string, string> = {
        [HEADER_X_API_KEY]: `${this.config.apiKey}`,
        [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
        [HEADER_X_SDK_VERSION]: SDK_VERSION,
        [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
      }
      const body = {
        visitorId: visitor.visitorId,
        type: 'CONTEXT',
        data: visitor.context
      }
      await this._httpClient.postAsync(url, { headers, body })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      logError(this.config, error.message || error, 'sendContext')
    }
  }

  async getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[]> {
    this.sendContext(visitor)

    if (!this._bucketingContent) {
      return []
    }
    if (this._bucketingContent.panic) {
      this.panic = true
      return []
    }
    this.panic = false

    if (!this._bucketingContent.campaigns) {
      return []
    }

    const visitorCampaigns:CampaignDTO[] = []

    this._bucketingContent.campaigns.forEach(campaign => {
      const currentCampaigns = this.getVisitorCampaigns(campaign.variationGroups, campaign.id, visitor)
      if (currentCampaigns) {
        visitorCampaigns.push(currentCampaigns)
      }
    })
    return visitorCampaigns
  }

  private getVisitorCampaigns (variationGroups : VariationGroupDTO[], campaignId: string, visitor: VisitorAbstract) :CampaignDTO|null {
    for (const variationGroup of variationGroups) {
      const check = this.isMatchTargeting(variationGroup, visitor)
      if (check) {
        const variation = this.getVariation(
          variationGroup,
          visitor.visitorId
        )
        if (!variation) {
          return null
        }
        return {
          id: campaignId,
          variation: variation,
          variationGroupId: variationGroup.id
        }
      }
    }
    return null
  }

  private getVariation (variationGroup:VariationGroupDTO, visitorId:string): VariationDTO|null {
    const hash = this._murmurHash.murmurHash3Int32(variationGroup.id + visitorId)
    const hashAllocation = hash % 100
    let totalAllocation = 0

    for (const variation of variationGroup.variations) {
      if (variation.allocation === undefined) {
        continue
      }
      totalAllocation += variation.allocation

      if (hashAllocation < totalAllocation) {
        return {
          id: variation.id,
          modifications: variation.modifications,
          reference: !!variation.reference
        }
      }
    }
    return null
  }

  private isMatchTargeting (variationGroup:VariationGroupDTO, visitor: VisitorAbstract):boolean {
    if (!variationGroup || !variationGroup.targeting || !variationGroup.targeting.targetingGroups) {
      return false
    }
    return variationGroup.targeting.targetingGroups.some(
      targetingGroup => this.checkAndTargeting(targetingGroup.targetings, visitor)
    )
  }

  private checkAndTargeting (targetings:Targetings[], visitor: VisitorAbstract) : boolean {
    let contextValue:primitive
    let check = false

    for (const { key, value, operator } of targetings) {
      if (key === 'fs_all_users') {
        check = true
        continue
      } else if (key === 'fs_users') {
        contextValue = visitor.visitorId
      } else {
        if (!(key in visitor.context)) {
          continue
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
  private testOperator (operator: string, contextValue : primitive, value: any): boolean {
    let check:boolean
    switch (operator) {
      case 'EQUALS':
        check = contextValue === value
        break
      case 'NOT_EQUALS':
        check = contextValue !== value
        break
      case 'CONTAINS':
        check = new RegExp(`${value.join('|')}`).test(contextValue.toString())
        break
      case 'NOT_CONTAINS':
        check = !(new RegExp(`${value.join('|')}`).test(contextValue.toString()))
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
        check = new RegExp(`^${value}`).test(contextValue.toString())
        break
      case 'ENDS_WITH':
        check = new RegExp(`${value}$`).test(contextValue.toString())
        break
      default:
        check = false
        break
    }

    return check
  }
}
