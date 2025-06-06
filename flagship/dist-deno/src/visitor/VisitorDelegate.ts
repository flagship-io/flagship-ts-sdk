import { type HitAbstract } from '../hit/HitAbstract.ts';
import { primitive, IHit, IFSFlagMetadata } from '../types.ts';
import { VisitorAbstract } from './VisitorAbstract.ts';
import { FSFlag } from '../flag/FsFlags.ts';
import { logWarningSprintf, visitorFlagSyncStatusMessage } from '../utils/utils.ts';
import { GET_FLAG } from '../enum/FlagshipConstant.ts';
import { FSFetchStatus } from '../enum/FSFetchStatus.ts';
import { IFSFlag } from '../flag/IFSFlag.ts';
import { GetFlagMetadataParam, GetFlagValueParam, VisitorExposedParam } from '../type.local.ts';
import { IFSFlagCollection } from '../flag/IFSFlagCollection.ts';
import { FSFlagCollection } from '../flag/FSFlagCollection.ts';

export class VisitorDelegate extends VisitorAbstract {
  updateContext (key: string, value: primitive):void
  updateContext (context: Record<string, primitive>): void
  updateContext(context: Record<string, primitive> | string, value?:primitive): void {
    this.getStrategy().updateContext(context, value);
    this.loadPredefinedContext();
  }

  clearContext(): void {
    this.getStrategy().clearContext();
  }

  getFlag(key:string):IFSFlag {
    if (this.flagsStatus.status !== FSFetchStatus.FETCHED && this.flagsStatus.status !== FSFetchStatus.FETCHING) {
      logWarningSprintf(this.config, GET_FLAG, visitorFlagSyncStatusMessage(this.flagsStatus.reason), this.visitorId, key);
    }
    return new FSFlag({
      key,
      visitor: this
    });
  }

  getFlags(): IFSFlagCollection {
    return new FSFlagCollection({ visitor: this });
  }

  sendHit(hit: HitAbstract): Promise<void>
  sendHit(hit: IHit): Promise<void>
  sendHit(hit: HitAbstract | IHit): Promise<void> {
    return this.getStrategy().sendHit(hit);
  }

  sendHits(hits: HitAbstract[]): Promise<void>
  sendHits(hits: IHit[]): Promise<void>
  sendHits(hits: HitAbstract[] | IHit[]): Promise<void> {
    return this.getStrategy().sendHits(hits);
  }

  authenticate(visitorId: string): void {
    this.getStrategy().authenticate(visitorId);
    this.updateCache();
  }

  unauthenticate(): void {
    this.getStrategy().unauthenticate();
    this.updateCache();
  }

  async fetchFlags():Promise<void> {
    await this.getStrategy().fetchFlags();
  }

  visitorExposed(param:VisitorExposedParam): Promise<void> {
    return this.getStrategy().visitorExposed(param);
  }

  getFlagValue<T>(param:GetFlagValueParam<T>): T extends null ? unknown : T {
    return this.getStrategy().getFlagValue(param);
  }

  getFlagMetadata(param:GetFlagMetadataParam):IFSFlagMetadata {
    return this.getStrategy().getFlagMetadata(param);
  }
}
