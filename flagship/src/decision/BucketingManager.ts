import { Modification } from '..'
import { BUCKETING_API_URL, REQUEST_TIME_OUT } from '../enum/index'
import { HttpClient } from '../utils/NodeHttpClient'
import { logError, logInfo, sleep, sprintf } from '../utils/utils'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { bucketingDTO } from './api/bucketingDTO'
import { CampaignDTO } from './api/models'
import { DecisionManager } from './DecisionManager'

export class BucketingManager extends DecisionManager {
    private _bucketingContent!:bucketingDTO;
    private _lastModified!:string
    private _isPooling!:boolean

    public async startPolling (): Promise<void> {
      this._isPooling = true
      if (this.config.pollingInterval === 0) {
        this._isPooling = false
      }
      logInfo(this.config, 'Bucketing polling starts', 'startPolling')
      do {
        try {
          const url = sprintf(BUCKETING_API_URL, this.config.envId)
          const headers:Record<string, unknown> = {}
          if (this._lastModified) {
            headers['If-Modified-Since'] = this._lastModified
          }
          const response = await this._httpClient.getAsync(url)
          if (response.status === 304) {
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

    getModifications (campaigns: CampaignDTO[]): Map<string, Modification> {
      throw new Error('Method not implemented.')
    }

    getCampaignsAsync (visitor: VisitorAbstract): Promise<CampaignDTO[]> {
      throw new Error('Method not implemented.')
    }

    getCampaignsModificationsAsync (visitor: VisitorAbstract): Promise<Map<string, Modification>> {
      throw new Error('Method not implemented.')
    }
}
