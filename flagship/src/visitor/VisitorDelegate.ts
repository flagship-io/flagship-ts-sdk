import { HitAbstract } from '../hit/index'
import { primitive, IHit, IFSFlagMetadata } from '../types'
import { VisitorAbstract } from './VisitorAbstract'
import { FSFlag } from '../flag/FsFlags'
import { logWarningSprintf, visitorFlagSyncStatusMessage } from '../utils/utils'
import { GET_FLAG } from '../enum/FlagshipConstant'
import { FSFetchStatus } from '../enum/FSFetchStatus'
import { IFSFlag } from '../flag/IFSFlag'
import { GetFlagMetadataParam, GetFlagValueParam, VisitorExposedParam } from '../type.local'

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

  getFlag (key:string):IFSFlag {
    if (this.fetchStatus.status !== FSFetchStatus.FETCHED) {
      logWarningSprintf(this.config, GET_FLAG, visitorFlagSyncStatusMessage(this.fetchStatus.reason), this.visitorId, key)
    }
    return new FSFlag({ key, visitor: this })
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

  visitorExposed (param:VisitorExposedParam): Promise<void> {
    return this.getStrategy().visitorExposed(param)
  }

  getFlagValue<T> (param:GetFlagValueParam<T>): T extends null ? unknown : T {
    return this.getStrategy().getFlagValue(param)
  }

  getFlagMetadata (param:GetFlagMetadataParam):IFSFlagMetadata {
    return this.getStrategy().getFlagMetadata(param)
  }
}
