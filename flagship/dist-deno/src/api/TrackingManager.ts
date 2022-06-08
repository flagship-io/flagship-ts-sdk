import { HitAbstract } from '../hit/index.ts'
import { TrackingManagerAbstract } from './TrackingManagerAbstract.ts'

export class TrackingManager extends TrackingManagerAbstract {
  public async addHit (hit: HitAbstract): Promise<void> {
    await this.strategy.addHit(hit)
  }

  public async addHits (hits: HitAbstract[]): Promise<void> {
    await this.strategy.addHits(hits)
  }
}
