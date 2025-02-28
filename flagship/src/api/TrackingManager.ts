import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { HitAbstract } from '../hit/index'
import { ActivateConstructorParam } from '../type.local'
import { TrackingManagerAbstract } from './TrackingManagerAbstract'

export class TrackingManager extends TrackingManagerAbstract {
  public async activateFlag (hit: ActivateConstructorParam): Promise<void> {
    await this.strategy.activateFlag(hit)
  }

  public async addHit (hit: HitAbstract): Promise<void> {
    await this.strategy.addHit(hit)
  }

  public async sendBatch (): Promise<void> {
    await this.strategy.sendBatch(BatchTriggeredBy.Flush)
  }
}
