import { Modification } from '../index.ts'
import { HitAbstract } from '../hit/index.ts'
import { primitive, modificationsRequested, IHit } from '../types.ts'
import { IVisitor } from './IVisitor.ts'
import { VisitorAbstract } from './VisitorAbstract.ts'
import { IConfigManager, IFlagshipConfig } from '../config/index.ts'
import { CampaignDTO } from '../decision/api/models.ts'
import { ITrackingManager } from '../api/TrackingManagerAbstract.ts'
import { IDecisionManager } from '../decision/IDecisionManager.ts'
import { logError } from '../utils/utils.ts'
export abstract class VisitorStrategyAbstract implements Omit<IVisitor, 'visitorId'|'modifications'|'context'|'hasConsented'|'getModificationsArray'> {
    protected visitor:VisitorAbstract;

    protected get configManager ():IConfigManager {
      return this.visitor.configManager
    }

    protected get trackingManager ():ITrackingManager {
      return this.configManager.trackingManager
    }

    protected get decisionManager ():IDecisionManager {
      return this.configManager.decisionManager
    }

    public get config ():IFlagshipConfig {
      return this.visitor.config
    }

    public constructor (visitor:VisitorAbstract) {
      this.visitor = visitor
    }

    public updateCampaigns (campaigns:CampaignDTO[]):void {
      try {
        this.visitor.campaigns = campaigns
        this.visitor.modifications = this.decisionManager.getModifications(campaigns)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error:any) {
        logError(this.config, error.message || error, 'updateCampaigns')
      }
    }

    abstract setConsent (hasConsented: boolean): void
    abstract updateContext(context: Record<string, primitive>): void
    abstract clearContext (): void

    abstract getModification<T>(params: modificationsRequested<T>): Promise<T>;
    abstract getModificationSync<T>(params: modificationsRequested<T>): T

    abstract getModifications<T> (params: modificationsRequested<T>[], activateAll?: boolean): Promise<T[]>
    abstract getModificationsSync<T> (params: modificationsRequested<T>[], activateAll?: boolean): T[]

    abstract getModificationInfo (key: string): Promise<Modification | null>
    abstract getModificationInfoSync(key: string): Modification | null

    abstract synchronizeModifications (): Promise<void>

    abstract activateModification(key: string): Promise<void>;

    abstract activateModifications(keys: { key: string; }[]): Promise<void>;
    abstract activateModifications(keys: string[]): Promise<void>;
    abstract activateModifications (params: Array<{ key: string }> | Array<string>): Promise<void>

    abstract sendHit(hit: HitAbstract): Promise<void>;
    abstract sendHit(hit: IHit): Promise<void>;
    abstract sendHit(hit: IHit|HitAbstract): Promise<void>;

    abstract sendHits(hit: HitAbstract[]): Promise<void>;
    abstract sendHits(hit: IHit[]): Promise<void>;
    abstract sendHits (hit: HitAbstract[]|IHit[]): Promise<void>

    abstract getAllModifications (activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

    abstract getModificationsForCampaign (campaignId: string, activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

    abstract authenticate(visitorId: string): void
    abstract unauthenticate(): void
}
