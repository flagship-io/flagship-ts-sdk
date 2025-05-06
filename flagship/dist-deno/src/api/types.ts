import { IFlagshipConfig } from '../config/IFlagshipConfig.ts';
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy.ts';

import { type Activate } from '../hit/Activate.ts';
import { type UsageHit } from '../hit/UsageHit.ts';
import { type Troubleshooting } from '../hit/Troubleshooting.ts';
import { IHttpClient } from '../utils/HttpClient.ts';
import { ISharedActionTracking } from '../sharedFeature/ISharedActionTracking.ts';
import { type HitAbstract } from '../hit/HitAbstract.ts';

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
