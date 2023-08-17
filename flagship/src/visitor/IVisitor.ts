import { IFlagshipConfig } from '../config/index'
import { CampaignDTO } from '../decision/api/models'
import { HitAbstract, HitShape } from '../hit/index'
import { IFlag } from '../flag/Flags'
import { IHit, FlagDTO, modificationsRequested, primitive, Modification, ForcedVariation, ExposedVariation } from '../types'

export interface IVisitor {
  visitorId: string;
  anonymousId: string|null
  flagsData: Map<string, FlagDTO>;
  /**
   * @deprecated use flagsData instead
   */
  modifications: Map<string, Modification>;
  context: Record<string, primitive>;

  /**
   * @deprecated use getFlagsDataArray instead
   */
  getModificationsArray():FlagDTO[]

  /**
   * Return an array of all flags fetched for the current visitor
   */
  getFlagsDataArray():FlagDTO[]

  /**
   * Return True or False if the visitor has consented for protected data usage.
   * @return bool
   */
  hasConsented: boolean;

  /**
   * Set if visitor has consented for protected data usage.
   * @param {boolean} hasConsented True if the visitor has consented false otherwise.
   */
  setConsent(hasConsented: boolean): void;

  config: IFlagshipConfig;
  /**
   * Update the visitor context values, matching the given keys, used for targeting.
   *
   * A new context value associated with this key will be created if there is no previous matching value.
   *
   * Context keys must be String, and values types must be one of the following : Number, Boolean, String.
   * @param {Record<string, primitive>} context : collection of keys, values.
   */
  updateContext(context: Record<string, primitive>): void;
  /**
  * Update the visitor context values, matching the given keys, used for targeting.
   *
   * A new context value associated with this key will be created if there is no previous matching value.
   * @param key Context keys must be String.
   * @param value values types must be one of the following : Number, Boolean, String.
   *
   */
  updateContext(key: string, value:primitive):void

  /**
   * clear the actual visitor context
   */
  clearContext(): void;

  /**
   * Retrieve a modification value by key. If no modification match the given
   * key or if the stored value type and default value type do not match, default value will be returned.
   * @param {modificationsRequested<T>} params
   * @param {boolean} activateAll
   * @deprecated use getFlag instead
   */
  getModification<T>(params: modificationsRequested<T>): Promise<T>;

  /**
   * Return a Flag object by its key. If no flag match the given key an empty flag will be returned.
   * @param key key associated to the flag.
   * @param defaultValue flag default value.
   */
  getFlag<T>(key:string, defaultValue: T):IFlag<T>

  /**
   * Retrieve an array of modification value by keys. If no modification match the given
   * key or if the stored value type and default value type do not match, an array of default value will be returned.
   * @param {modificationsRequested<T>[]} params
   * @param {boolean} activateAll
   * @deprecated use getFlag instead
   */
  getModifications<T>(
    params: modificationsRequested<T>[],
    activateAll?: boolean
  ): Promise<Record<string, T>>;

  /**
   * Retrieve a modification value by key. If no modification match the given
   * key or if the stored value type and default value type do not match, default value will be returned.
   * @param {modificationsRequested<T>} params
   * @param {boolean} activateAll
   * @deprecated use getFlag instead
   */
  getModificationSync<T>(params: modificationsRequested<T>): T;

 /**
   *Retrieve an array of modification value by keys. If no modification match the given
   * key or if the stored value type and default value type do not match, an array of default value will be returned.
   * @param {modificationsRequested<T>[]} params
   * @param {boolean} activateAll
   * @deprecated use getFlag instead
   */
  getModificationsSync<T>(
    params: modificationsRequested<T>[],
    activateAll?: boolean
  ): Record<string, T>;

  /**
   * Get the campaign modification information value matching the given key.
   * @param {string} key : key which identify the modification.
   * @returns {FlagDTO | null}
   * @deprecated use getFlag instead
   */
  getModificationInfo(key: string): Promise<FlagDTO | null>;

  /**
   * Get the campaign modification information value matching the given key.
   * @param {string} key : key which identify the modification.
   * @returns {FlagDTO | null}
   * @deprecated use getFlag instead
   */
  getModificationInfoSync(key: string): FlagDTO | null;

  /**
   * This function calls the decision api and update all the campaigns modifications
   * from the server according to the visitor context.
   * @deprecated use fetchFlags instead
   */
  synchronizeModifications(): Promise<void>;

   /**
   * This function calls the decision api and update all the campaigns modifications
   * from the server according to the visitor context.
   */
  fetchFlags(): Promise<void>;

  /**
   * Report this user has seen this modification.
   * @param key : key which identify the modification to activate.
   *
   * @deprecated use getFlag instead
   */
  activateModification(key: string): Promise<void>;
  /**
   * Report this user has seen these modifications.
   * @param {Array<{ key: string }>} keys keys which identify the modifications to activate.
   * @deprecated use getFlag instead
   */
   activateModifications(keys: { key: string }[]): Promise<void>;
  /**
   * Report this user has seen these modifications.
   * @param keys  keys which identify the modifications to activate.
   * @deprecated use getFlag instead
   */
   activateModifications(keys: string[]): Promise<void>;

  /**
   * Send a Hit to Flagship servers for reporting.
   * @param hit
   */
  sendHit(hit: HitAbstract): Promise<void>;
  sendHit(hit: IHit): Promise<void>;
  /**
   * Send a Hit to Flagship servers for reporting.
   * @deprecated
   * @param hit
   */
  sendHit(hit: HitShape): Promise<void>;

  /**
   * Send Hits to Flagship servers for reporting.
   * @param hit
   */
  sendHits(hit: Array<HitAbstract>): Promise<void>;
  sendHits(hit: Array<IHit>): Promise<void>;
  /**
   * Send Hits to Flagship servers for reporting.
   * @deprecated
   * @param hit
   */
  sendHits(hit: Array<HitShape>): Promise<void>;

  /**
   * returns a Promise<object> containing all the data for all the campaigns associated with the current visitor.
   *
   * @deprecated use getAllFlagsData instead
   */
  getAllModifications(activate: boolean): Promise<{
    visitorId: string;
    campaigns: CampaignDTO[];
  }>;

  /**
   * returns a Promise<object> containing all the data for all the campaigns associated with the current visitor.
   */
   getAllFlagsData(activate: boolean): Promise<{
    visitorId: string;
    campaigns: CampaignDTO[];
  }>;

  /**
   * Get data for a specific campaign.
   * @param campaignId Identifies the campaign whose modifications you want to retrieve.
   * @param activate
   * @deprecated use getFlatsDataForCampaign instead
   */
  getModificationsForCampaign(
    campaignId: string,
    activate: boolean
  ): Promise<{
    visitorId: string;
    campaigns: CampaignDTO[];
  }>;

  /**
   * Get data for a specific campaign.
   * @param campaignId Identifies the campaign whose modifications you want to retrieve.
   * @param activate
   */
   getFlatsDataForCampaign(
    campaignId: string,
    activate: boolean
  ): Promise<{
    visitorId: string;
    campaigns: CampaignDTO[];
  }>;

  /**
   * Authenticate anonymous visitor
   * @param {string} visitorId
   */
  authenticate(visitorId: string): void;

  /**
   * This function change authenticated Visitor to anonymous visitor
   */
  unauthenticate(): void;

  addForcedVariation(value: ForcedVariation):IVisitor
  removeForcedVariation(variationId: string):IVisitor

  getExposedVariations():ExposedVariation[]
}
