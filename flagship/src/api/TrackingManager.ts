import { HitAbstract } from '../hit/index'
import { TrackingManagerAbstract } from './TrackingManagerAbstract'

export class TrackingManager extends TrackingManagerAbstract {
  public async addHit (hit: HitAbstract): Promise<void> {
    await this.strategy.addHit(hit)
  }
}
