import { IFlagshipConfig } from '../config/FlagshipConfig'
import { CampaignDTO } from '../decision/api/models'
import { HitAbstract } from '../hit/index'
import { IHit, Modification, modificationsRequested, primitive } from '../types'

export interface IVisitor {
  visitorId: string;
  modifications: Map<string, Modification>;
  context: Record<string, primitive>;

  getModificationsArray():Modification[]

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
   * clear the actual visitor context
   */
  clearContext(): void;

  /**
   * Retrieve a modification value by key. If no modification match the given
   * key or if the stored value type and default value type do not match, default value will be returned.
   * @param {modificationsRequested<T>} params
   * @param {boolean} activateAll
   */
  getModification<T>(params: modificationsRequested<T>): Promise<T>;

  /**
   * Retrieve an array of modification value by keys. If no modification match the given
   * key or if the stored value type and default value type do not match, an array of default value will be returned.
   * @param {modificationsRequested<T>[]} params
   * @param {boolean} activateAll
   */
  getModifications<T>(
    params: modificationsRequested<T>[],
    activateAll?: boolean
  ): Promise<T[]>;

  /**
   * Retrieve a modification value by key. If no modification match the given
   * key or if the stored value type and default value type do not match, default value will be returned.
   * @param {modificationsRequested<T>} params
   * @param {boolean} activateAll
   */
  getModificationSync<T>(params: modificationsRequested<T>): T;

 /**
   *Retrieve an array of modification value by keys. If no modification match the given
   * key or if the stored value type and default value type do not match, an array of default value will be returned.
   * @param {modificationsRequested<T>[]} params
   * @param {boolean} activateAll
   */
  getModificationsSync<T>(
    params: modificationsRequested<T>[],
    activateAll?: boolean
  ): T[];

  /**
   * Get the campaign modification information value matching the given key.
   * @param {string} key : key which identify the modification.
   * @returns {Modification | null}
   */
  getModificationInfo(key: string): Promise<Modification | null>;

  /**
   * Get the campaign modification information value matching the given key.
   * @param {string} key : key which identify the modification.
   * @returns {Modification | null}
   */
  getModificationInfoSync(key: string): Modification | null;

  /**
   * This function calls the decision api and update all the campaigns modifications
   * from the server according to the visitor context.
   */
  synchronizeModifications(): Promise<void>;

  /**
   * Report this user has seen this modification.
   * @param key : key which identify the modification to activate.
   */
  activateModification(key: string): Promise<void>;
  /**
   * Report this user has seen these modifications.
   * @deprecated use ["key1","key2",...] instead of
   * @param {Array<{ key: string }>} keys keys which identify the modifications to activate.
   */
   activateModifications(keys: Array<{ key: string }>): Promise<void>;
  /**
   * Report this user has seen these modifications.
   * @param keys  keys which identify the modifications to activate.
   */
   activateModifications(keys: Array<string>): Promise<void>;

  /**
   * Send a Hit to Flagship servers for reporting.
   * @param hit
   */
  sendHit(hit: HitAbstract): Promise<void>;
  sendHit(hit: IHit): Promise<void>;

  /**
   * Send Hits to Flagship servers for reporting.
   * @param hit
   */
  sendHits(hit: Array<HitAbstract>): Promise<void>;
  sendHits(hit: Array<IHit>): Promise<void>;

  /**
   * returns a Promise<object> containing all the data for all the campaigns associated with the current visitor.
   */
  getAllModifications(activate: boolean): Promise<{
    visitorId: string;
    campaigns: CampaignDTO[];
  }>;

  /**
   * Get data for a specific campaign.
   * @param campaignId Identifies the campaign whose modifications you want to retrieve.
   * @param activate
   */
  getModificationsForCampaign(
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
}
