import { BatchTriggeredBy } from '../enum/BatchTriggeredBy.ts'
import { type HitAbstract } from '../hit/HitAbstract.ts'
import { ActivateConstructorParam } from '../type.local.ts'
import { TrackingManagerAbstract } from './TrackingManagerAbstract.ts'

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
