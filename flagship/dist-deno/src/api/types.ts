import { IFlagshipConfig } from '../config/IFlagshipConfig.ts'
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy.ts'
import { HitAbstract } from '../hit/index.ts'
import { Activate } from '../hit/Activate.ts'
import { Analytic } from '../hit/Analytic.ts'
import { Troubleshooting } from '../hit/Troubleshooting.ts'
import { IHttpClient } from '../utils/HttpClient.ts'

export type BatchingCachingStrategyConstruct = {
    config: IFlagshipConfig,
    httpClient: IHttpClient,
    hitsPoolQueue: Map<string, HitAbstract>,
    activatePoolQueue: Map<string, Activate>,
    troubleshootingQueue: Map<string, Troubleshooting>
    analyticHitQueue: Map<string, Analytic>
    flagshipInstanceId?:string
   }

export type SendActivate = {
    activateHitsPool:Activate[],
   currentActivate?:Activate
   batchTriggeredBy: BatchTriggeredBy
  }
