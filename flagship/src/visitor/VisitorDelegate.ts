import { HitAbstract } from '../hit/index'
import { primitive, IHit, IFlagMetadata, FlagDTO } from '../types'
import { VisitorAbstract } from './VisitorAbstract'
import { Flag, IFlag } from '../flag/Flags'
import { logWarningSprintf, visitorFlagSyncStatusMessage } from '../utils/utils'
import { GET_FLAG } from '../enum/FlagshipConstant'
import { FlagSynchStatus } from '../enum/FlagSynchStatus'

export class VisitorDelegate extends VisitorAbstract {
  updateContext (key: string, value: primitive):void
  updateContext (context: Record<string, primitive>): void
  updateContext (context: Record<string, primitive> | string, value?:primitive): void {
    this.getStrategy().updateContext(context, value)
    this.loadPredefinedContext()
  }

  clearContext (): void {
    this.getStrategy().clearContext()
  }

  getFlag<T> (key:string, defaultValue: T):IFlag<T> {
    if (this.flagSynchStatus !== FlagSynchStatus.FLAGS_FETCHED) {
      logWarningSprintf(this.config, GET_FLAG, visitorFlagSyncStatusMessage(this.flagSynchStatus), this.visitorId, key)
    }
    return new Flag({ key, visitor: this, defaultValue })
  }

  sendHit(hit: HitAbstract): Promise<void>
  sendHit(hit: IHit): Promise<void>
  sendHit (hit: HitAbstract | IHit): Promise<void> {
    return this.getStrategy().sendHit(hit)
  }

  sendHits(hits: HitAbstract[]): Promise<void>
  sendHits(hits: IHit[]): Promise<void>
  sendHits (hits: HitAbstract[] | IHit[]): Promise<void> {
    return this.getStrategy().sendHits(hits)
  }

  authenticate (visitorId: string): void {
    this.getStrategy().authenticate(visitorId)
    this.updateCache()
  }

  unauthenticate (): void {
    this.getStrategy().unauthenticate()
    this.updateCache()
  }

  async fetchFlags ():Promise<void> {
    await this.getStrategy().lookupVisitor()
    await this.getStrategy().fetchFlags()
    await this.getStrategy().cacheVisitor()
  }

  visitorExposed <T> (param:{key:string, flag?:FlagDTO, defaultValue:T}): Promise<void> {
    return this.getStrategy().visitorExposed(param)
  }

  getFlagValue<T> (param:{ key:string, defaultValue: T, flag?:FlagDTO, userExposed?: boolean}):T {
    return this.getStrategy().getFlagValue(param)
  }

  getFlagMetadata (param:{metadata:IFlagMetadata, key?:string, hasSameType:boolean}):IFlagMetadata {
    return this.getStrategy().getFlagMetadata(param)
  }
}
