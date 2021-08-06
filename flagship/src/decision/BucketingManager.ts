import { IFlagshipConfig } from '../config'
import { BUCKETING_API_URL, REQUEST_TIME_OUT } from '../enum/index'
import { primitive } from '../types'
import { IHttpClient } from '../utils/httpClient'
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

    public constructor (httpClient: IHttpClient, config: IFlagshipConfig, murmurHash: MurmurHash) {
      super(httpClient, config)
      this._murmurHash = murmurHash
    }

    public async startPolling (): Promise<void> {
      this._isPooling = true
      if (this.config.pollingInterval === 0) {
        this._isPooling = false
      }
      logInfo(this.config, 'Bucketing polling starts', 'startPolling')
      do {
        try {
          const url = sprintf(BUCKETING_API_URL, this.config.envId)
          const headers:Record<string, string> = {}
          if (this._lastModified) {
            headers['If-Modified-Since'] = this._lastModified
          }
          const response = await this._httpClient.getAsync(url, { headers })
          if (response.status === 200) {
            this._bucketingContent = response.body
          }
          if (response.headers) {
            this._lastModified = response.headers['Last-Modified']
          }
          await sleep((this.config.pollingInterval ?? REQUEST_TIME_OUT) * 1000)
        } catch (error) {
        // logError(this.config, error,)
        }
      // eslint-disable-next-line no-unmodified-loop-condition
      } while (this._isPooling)
    }

    public stopPolling ():void {
      this._isPooling = false
    }

    getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[]> {
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
        console.log('variation.allocation', variation.allocation)

        console.log(totalAllocation)

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

      for (const targeting of targetings) {
        const key = targeting.key
        switch (key) {
          case 'fs_all_users':
            return true
          case 'fs_users':
            contextValue = visitor.visitorId
            break
          default:
            if (!(key in visitor.context)) {
              return false
            }
            contextValue = visitor.context[key]
            break
        }

        return this.testOperator(targeting.operator, contextValue, targeting.value)
      }
      return false
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
          check = new RegExp(`${value.join('|')}`, 'i').test(contextValue.toString())
          break
        case 'NOT_CONTAINS':
          check = !(new RegExp(`${value.join('|')}`, 'i').test(contextValue.toString()))
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
          check = new RegExp(`^${value}`, 'i').test(contextValue.toString())
          break
        case 'ENDS_WITH':
          check = new RegExp(`${value}$`, 'i').test(contextValue.toString())
          break
        default:
          check = false
          break
      }

      return check
    }
}
