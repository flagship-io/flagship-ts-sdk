import { LogLevel } from '../enum'
import { BatchTriggeredBy } from '../enum/BatchTriggeredBy'
import { Activate } from '../hit/Activate'
import { HitAbstract } from '../hit/index'
import { Monitoring } from '../hit/Monitoring'
import { TrackingManagerAbstract } from './TrackingManagerAbstract'

export class TrackingManager extends TrackingManagerAbstract {
  public async activateFlag (hit: Activate): Promise<void> {
    await this.strategy.activateFlag(hit)
  }

  public async addHit (hit: HitAbstract): Promise<void> {
    await this.strategy.addHit(hit)
    const monitoring = new Monitoring({
      type: 'TROUBLESHOOTING',
      subComponent: 'VISITOR-SEND-HIT',
      logLevel: LogLevel.INFO,
      message: 'VISITOR-SEND-HIT',
      visitorId: hit.visitorId,
      anonymousId: hit.anonymousId,
      config: this.config,
      hitContent: hit.toApiKeys()
    })

    this.addMonitoringHit(monitoring)
  }

  public async sendBatch (): Promise<void> {
    await this.strategy.sendBatch(BatchTriggeredBy.Flush)
  }
}
