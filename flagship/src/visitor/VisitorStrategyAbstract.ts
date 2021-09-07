import { Modification } from '../index'
import { HitAbstract, IPage, IScreen, IEvent, IItem, ITransaction } from '../hit/index'
import { primitive, modificationsRequested } from '../types'
import { IVisitor } from './IVisitor'
import { VisitorAbstract } from './VisitorAbstract'
import { IConfigManager, IFlagshipConfig } from '../config/index'
import { CampaignDTO } from '../decision/api/models'
import { ITrackingManager } from '../api/TrackingManagerAbstract'
import { IDecisionManager } from '../decision/IDecisionManager'
export abstract class VisitorStrategyAbstract implements Omit<IVisitor, 'visitorId'|'modifications'|'context'|'hasConsented'> {
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

    abstract setConsent (hasConsented: boolean): void
    abstract updateContext(context: Record<string, primitive>): void
    abstract clearContext (): void

    abstract getModification<T>(params: modificationsRequested<T>, activateAll?: boolean): Promise<T>;
    abstract getModification<T>(params: modificationsRequested<T>[], activateAll?: boolean): Promise<T[]>;
    abstract getModification<T>(params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): Promise<T | T[]>;

    abstract getModificationSync<T>(params: modificationsRequested<T>, activateAll?: boolean): T
    abstract getModificationSync<T>(params: modificationsRequested<T>[], activateAll?: boolean): T[]
    abstract getModificationSync<T>(params: modificationsRequested<T> | modificationsRequested<T>[], activateAll?: boolean): T | T[]

    abstract getModificationInfo (key: string): Promise<Modification | null>
    abstract getModificationInfoSync(key: string): Modification | null

    abstract synchronizeModifications (): Promise<void>

    abstract activateModification(key: string): Promise<void>;
    abstract activateModification(keys: { key: string; }[]): Promise<void>;
    abstract activateModification(keys: string[]): Promise<void>;
    abstract activateModification (params: string | Array<{ key: string }> | Array<string>): Promise<void>

    abstract activateModificationSync(key: string): void
    abstract activateModificationSync(keys: { key: string }[]): void
    abstract activateModificationSync(keys: string[]): void
    abstract activateModificationSync (params: string | Array<{ key: string }> | Array<string>): void

    abstract sendHit(hit: HitAbstract): Promise<void>;
    abstract sendHit(hit: HitAbstract[]): Promise<void>;
    abstract sendHit(hit: IPage | IScreen | IEvent | IItem | ITransaction): Promise<void>;
    abstract sendHit(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): Promise<void>;
    abstract sendHit (hit:IPage|IScreen|IEvent|IItem|ITransaction|
      Array<IPage|IScreen|IEvent|IItem|ITransaction>|HitAbstract|HitAbstract[]): Promise<void>

    abstract sendHitSync(hit: HitAbstract[]): void
    abstract sendHitSync(hit: HitAbstract): void
    abstract sendHitSync(hit: (IPage | IScreen | IEvent | IItem | ITransaction)[]): void
    abstract sendHitSync(hit: HitAbstract | IPage | IScreen | IEvent | IItem | ITransaction): void
    abstract sendHitSync (hit:IPage|IScreen|IEvent|IItem|ITransaction|
      Array<IPage|IScreen|IEvent|IItem|ITransaction>|HitAbstract|HitAbstract[]): void

    abstract getAllModifications (activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

    abstract getModificationsForCampaign (campaignId: string, activate: boolean): Promise<{ visitorId: string; campaigns: CampaignDTO[] }>

    abstract authenticate(visitorId: string): void
    abstract unauthenticate(): void
}
