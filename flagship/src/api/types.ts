import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { HitAbstract } from '../hit/index'
import { Activate } from '../hit/Activate'
import { UsageHit } from '../hit/UsageHit'
import { Troubleshooting } from '../hit/Troubleshooting'
import { IHttpClient } from '../utils/HttpClient'
import { ISharedActionTracking } from '../sharedFeature/ISharedActionTracking'

export type BatchingCachingStrategyConstruct = {
    config: IFlagshipConfig,
    httpClient: IHttpClient,
    hitsPoolQueue: Map<string, HitAbstract>,
    activatePoolQueue: Map<string, Activate>,
    troubleshootingQueue: Map<string, Troubleshooting>
    analyticHitQueue: Map<string, UsageHit>
    flagshipInstanceId?:string
    initTroubleshootingHit?: Troubleshooting
    sharedActionTracking?: ISharedActionTracking
   }

export type SendActivate = {
    activateHitsPool:Activate[],
   currentActivate?:Activate
   batchTriggeredBy: BatchTriggeredBy
  }
