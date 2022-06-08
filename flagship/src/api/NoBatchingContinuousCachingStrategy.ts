import { HitAbstract } from '../hit'
import { BatchingCachingStrategyAbstract } from './BatchingCachingStrategyAbstract'

export class NoBatchingContinuousCachingStrategy extends BatchingCachingStrategyAbstract {
  addHit (hit: HitAbstract): Promise<void> {
    throw new Error('Method not implemented.')
  }

  sendBatch (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  notConsent (visitorId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
