import { BatchTriggeredBy } from '../enum/BatchTriggeredBy.ts'
import { Activate } from '../hit/Activate.ts'
import { HitAbstract } from '../hit/index.ts'
import { TrackingManagerAbstract } from './TrackingManagerAbstract.ts'

export class TrackingManager extends TrackingManagerAbstract {
  public async activateFlag (hit: Activate): Promise<void> {
    await this.strategy.activateFlag(hit)
  }

  public async addHit (hit: HitAbstract): Promise<void> {
    await this.strategy.addHit(hit)
  }

  public async sendBatch (): Promise<void> {
    await this.strategy.sendBatch(BatchTriggeredBy.Flush)
  }
}
