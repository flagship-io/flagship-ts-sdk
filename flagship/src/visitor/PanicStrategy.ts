import { FSSdkStatus, FLAG_VISITOR_EXPOSED, METHOD_DEACTIVATED_ERROR, FLAG_METADATA, METADATA_PANIC_MODE } from '../enum/index';
import { CampaignDTO, FlagDTO, IFSFlagMetadata, IHit } from '../types';
import { logInfoSprintf } from '../utils/utils';
import { DefaultStrategy } from './DefaultStrategy';
import { type HitAbstract } from '../hit/HitAbstract';
import { BatchDTO } from '../hit/Batch';
import { FSFlagMetadata } from '../flag/FSFlagMetadata';

export class PanicStrategy extends DefaultStrategy {
  setConsent(hasConsented:boolean):void {
    this.visitor.hasConsented = hasConsented;
  }

  updateContext(): void {
    this.log('updateContext');
  }

  clearContext(): void {
    this.log('clearContext');
  }

  async lookupHits(): Promise<void> {
    //
  }

  async lookupVisitor(): Promise<void> {
    //
  }

  public async cacheVisitor():Promise<void> {
    //
  }

  protected async cacheHit(): Promise<void> {
    //
  }

  protected fetchCampaignsFromCache(): CampaignDTO[] {
    return [];
  }

  public sendVisitorAllocatedVariations(): void {
    //
  }

  async sendHit(_hit: HitAbstract | IHit| BatchDTO): Promise<void> {
    this.log('sendHit');
  }


  async sendHits(_hits: HitAbstract[] | IHit[]|BatchDTO[]): Promise<void> {
    this.log('sendHits');
  }

  getFlagValue<T>(param:{ key:string, defaultValue: T, flag?:FlagDTO, visitorExposed?: boolean}): T extends null ? unknown : T {
    this.log('Flag.value');
    return param.defaultValue as T extends null ? unknown : T;
  }

  async visitorExposed(): Promise<void> {
    this.log(FLAG_VISITOR_EXPOSED);
  }

  getFlagMetadata(param:{ key:string, flag?:FlagDTO}):IFSFlagMetadata {
    const emptyMetaData = FSFlagMetadata.Empty();
    logInfoSprintf(this.config, FLAG_METADATA, METADATA_PANIC_MODE, this.visitor.visitorId, param.key, emptyMetaData);
    return emptyMetaData;
  }


  public async sendTroubleshootingHit(): Promise<void> {
    //
  }

  public async sendSdkConfigAnalyticHit(): Promise<void> {
    //
  }


  protected async sendActivate(_flagDto: FlagDTO, _defaultValue?: unknown): Promise<void> {
    //
  }

  public async collectEAIEventsAsync(): Promise<void> {
    this.log('collectEAIData');
  }

  public reportEaiPageView(): void {
    //
  }

  public reportEaiVisitorEvent(): void {
    //
  }

  public onEAICollectStatusChange(): void {
    //
  }

  public async addInTrackingManager(): Promise<void> {
    //
  }

  private log(methodName:string):void {
    logInfoSprintf(this.config, methodName, METHOD_DEACTIVATED_ERROR, this.visitor.visitorId, methodName, FSSdkStatus[FSSdkStatus.SDK_PANIC]);
  }
}
