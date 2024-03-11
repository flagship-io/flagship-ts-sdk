import { IFlagshipConfig } from '../config/index'
import { HitAbstract } from '../hit/index'
import { IFlag } from '../flag/Flags'
import { IHit, FlagDTO, primitive } from '../types'

/**
 * Represents a visitor in the Flagship SDK.
 */
export interface IVisitor {
  visitorId: string;
  readonly anonymousId: string | null;
  readonly flagsData: Map<string, FlagDTO>;
  readonly context: Record<string, primitive>;
  /**
   * Returns an array of all flags fetched for the current visitor.
   * @returns An array of FlagDTO objects.
   */
  getFlagsDataArray(): FlagDTO[];

  /**
   * Returns true or false if the visitor has consented for protected data usage.
   * @returns A boolean value indicating whether the visitor has consented.
   */
  readonly hasConsented: boolean;

  /**
   * Sets whether the visitor has consented for protected data usage.
   * @param hasConsented - A boolean value indicating whether the visitor has consented.
   */
  setConsent(hasConsented: boolean): void;

  readonly config: IFlagshipConfig;

  /**
   * Updates the visitor context values, matching the given keys, used for targeting.
   * A new context value associated with this key will be created if there is no previous matching value.
   * @param context - A collection of keys and values.
   */
  updateContext(context: Record<string, primitive>): void;

  /**
   * Updates the visitor context value for the given key, used for targeting.
   * A new context value associated with this key will be created if there is no previous matching value.
   * @param key - The context key.
   * @param value - The context value.
   */
  updateContext(key: string, value: primitive): void;

  /**
   * Clears the actual visitor context.
   */
  clearContext(): void;

  /**
   * Returns a Flag object by its key. If no flag matches the given key, an empty flag will be returned.
   * @param key - The key associated with the flag.
   * @param defaultValue - The default value of the flag.
   * @returns An IFlag object.
   */
  getFlag<T>(key: string, defaultValue: T): IFlag<T>;

  /**
   * Calls the decision API and updates all the campaign modifications from the server according to the visitor context.
   * @returns A promise that resolves when the flags are fetched.
   */
  fetchFlags(): Promise<void>;

  /**
   * Sends a Hit to Flagship servers for reporting.
   * @param hit - The HitAbstract object to send.
   * @returns A promise that resolves when the hit is sent.
   */
  sendHit(hit: HitAbstract | IHit): Promise<void>;

  /**
   * Sends Hits to Flagship servers for reporting.
   * @param hits - An array of HitAbstract objects to send.
   * @returns A promise that resolves when the hits are sent.
   */
  sendHits(hits: Array<HitAbstract> | Array<IHit>): Promise<void>;

  /**
   * Authenticates an anonymous visitor.
   * @param visitorId - The ID of the visitor.
   */
  authenticate(visitorId: string): void;

  /**
   * Changes an authenticated visitor to an anonymous visitor.
   */
  unauthenticate(): void;
}
