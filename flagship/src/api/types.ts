import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'

import { type Activate } from '../hit/Activate'
import { type UsageHit } from '../hit/UsageHit'
import { type Troubleshooting } from '../hit/Troubleshooting'
import { IHttpClient } from '../utils/HttpClient'
import { ISharedActionTracking } from '../sharedFeature/ISharedActionTracking'
import { type HitAbstract } from '../hit/HitAbstract'

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
