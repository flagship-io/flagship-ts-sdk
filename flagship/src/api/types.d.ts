import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { HitAbstract } from '../hit'
import { Activate } from '../hit/Activate'
import { Monitoring } from '../hit/Monitoring'
import { IHttpClient } from '../utils/HttpClient'

export type BatchingCachingStrategyConstruct = {
    config: IFlagshipConfig,
    httpClient: IHttpClient,
    hitsPoolQueue: Map<string, HitAbstract>,
    activatePoolQueue: Map<string, Activate>,
    monitoringPoolQueue: Map<string, Monitoring>
    flagshipInstanceId?:string
   }

export type SendActivate = {
    activateHitsPool:Activate[],
   currentActivate?:Activate
   batchTriggeredBy: BatchTriggeredBy
  }
