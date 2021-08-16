import { IFlagshipConfig } from '../config/index'
import { BUCKETING_API_CONTEXT_URL, BUCKETING_API_URL, FlagshipStatus, HEADER_APPLICATION_JSON, HEADER_CONTENT_TYPE, HEADER_X_API_KEY, HEADER_X_SDK_CLIENT, HEADER_X_SDK_VERSION, REQUEST_TIME_OUT, SDK_LANGUAGE, SDK_VERSION } from '../enum/index'
import { primitive } from '../types'
import { IHttpClient, IHttpResponse } from '../utils/httpClient'
import { MurmurHash } from '../utils/MurmurHash'
import { logError, logInfo, sleep, sprintf } from '../utils/utils'
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

    public constructor (httpClient: IHttpClient, config: IFlagshipConfig, murmurHash: MurmurHash) {
      super(httpClient, config)
      this._murmurHash = murmurHash
      this._isFirstPooling = true
    }

    private initStartPolling () {
      if (this.config.pollingInterval === 0) {
        this._isPooling = false
      }
      logInfo(this.config, 'Bucketing polling starts', 'startPolling')
      if (this._isFirstPooling) {
        this.updateFlagshipStatus(FlagshipStatus.POLLING)
      }
    }

    private finishLoop (response: IHttpResponse) {
      if (response.status === 200) {
        this._bucketingContent = response.body
      }

      if (response.headers) {
        this._lastModified = response.headers['Last-Modified']
      }

      if (this._isFirstPooling) {
        this._isFirstPooling = false
        this.updateFlagshipStatus(FlagshipStatus.READY)
      }

      if (typeof this.config.onBucketingSuccess === 'function') {
        this.config.onBucketingSuccess({ status: response.status, payload: this._bucketingContent })
      }
    }

    public async startPolling (): Promise<void> {
      if (this._isPooling) {
        return
      }
      this._isPooling = true

      this.initStartPolling()

      do {
        try {
          const url = sprintf(BUCKETING_API_URL, this.config.envId)
          const headers:Record<string, string> = {
            [HEADER_X_API_KEY]: `${this.config.apiKey}`,
            [HEADER_X_SDK_CLIENT]: SDK_LANGUAGE,
            [HEADER_X_SDK_VERSION]: SDK_VERSION,
            [HEADER_CONTENT_TYPE]: HEADER_APPLICATION_JSON
          }

          if (this._lastModified) {
            headers['If-Modified-Since'] = this._lastModified
          }

          const response = await this._httpClient.getAsync(url, { headers })

          this.finishLoop(response)

          await sleep((this.config.pollingInterval ?? REQUEST_TIME_OUT) * 1000)
        } catch (error) {
          logError(this.config, error, 'startPolling')
          if (this._isFirstPooling) {
            this.updateFlagshipStatus(FlagshipStatus.NOT_INITIALIZED)
          }
          if (typeof this.config.onBucketingFail === 'function') {
            this.config.onBucketingFail(new Error(error))
          }
        }
      // eslint-disable-next-line no-unmodified-loop-condition
      } while (this._isPooling)
      logInfo(this.config, 'Bucketing polling stopped', 'startPolling')
    }

    public stopPolling ():void {
      this._isPooling = false
    }

    private sendContext (visitor: VisitorAbstract):Promise<void> {
      return new Promise((resolve) => {
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
        this._httpClient.postAsync(url, { headers, body })
          .then(() => {
            resolve()
          })
          .catch(error => {
            logError(this.config, error, 'sendContext')
          })
      })
    }

    getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[]> {
      this.sendContext(visitor)
      return new Promise<CampaignDTO[]>((resolve) => {
        if (!this._bucketingContent) {
          resolve([])
          return
        }
        if (this._bucketingContent.panic) {
          this.panic = true
          resolve([])
          return
        }
        this.panic = false

        if (!this._bucketingContent.campaigns) {
          resolve([])
          return
        }

        const visitorCampaigns:CampaignDTO[] = []

        this._bucketingContent.campaigns.forEach(campaign => {
          const currentCampaigns = this.getVisitorCampaigns(campaign.variationGroups, campaign.id, visitor)
          if (currentCampaigns) {
            visitorCampaigns.push(currentCampaigns)
          }
        })
        resolve(visitorCampaigns)
      })
    }

    private getVisitorCampaigns (variationGroups : VariationGroupDTO[], campaignId: string, visitor: VisitorAbstract) :CampaignDTO|null {
      for (const variationGroup of variationGroups) {
        const check = this.isMatchTargeting(variationGroup, visitor)
        if (check) {
          const variations = this.getVariation(
            variationGroup,
            visitor.visitorId
          )
          if (!variations) {
            return null
          }
          return {
            id: campaignId,
            variation: variations,
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
      for (const targetingGroup of variationGroup.targeting.targetingGroups) {
        const check = this.checkAndTargeting(targetingGroup.targetings, visitor)
        if (check) {
          return true
        }
      }
      return false
    }

    private checkAndTargeting (targetings:Targetings[], visitor: VisitorAbstract) : boolean {
      let contextValue:primitive
      let check = false

      for (const targeting of targetings) {
        const key = targeting.key

        if (key === 'fs_all_users') {
          check = true
          break
        } else if (key === 'fs_users') {
          contextValue = visitor.visitorId
        } else {
          if (!(key in visitor.context)) {
            continue
          }
          contextValue = visitor.context[key]
        }

        return this.testOperator(targeting.operator, contextValue, targeting.value)
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
