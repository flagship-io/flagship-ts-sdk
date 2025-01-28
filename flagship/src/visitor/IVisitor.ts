import { IFlagshipConfig } from '../config/index'
import { IFSFlag } from '../flag/IFSFlag'
import { IFSFlagCollection } from '../flag/IFSFlagCollection'
import { HitAbstract } from '../hit/index'
import { IHit, primitive, FlagsStatus } from '../types'

/**
 * The `Visitor` class represents a unique user within your application. It aids in
 * managing the visitor's data and fetching the corresponding flags for the visitor
 * from the [Flagship platform](https://app.flagship.io/login) .
 */
export interface IVisitor {
  /**
   * The unique visitor identifier.
   */
  visitorId: string;

  /**
   * The anonymous visitor identifier.
   */
  readonly anonymousId: string | null;

  /**
   * The visitor context.
   */
  readonly context: Record<string, primitive>;

  /**
   * The fetch status of the flags.
   */
  readonly fetchStatus: FlagsStatus

  /**
   * The Flagship configuration.
   */
  readonly config: IFlagshipConfig;

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
  getFlag(key: string): IFSFlag

  /**
   * Returns a collection of all flags fetched for the visitor.
   * @returns An IFSFlagCollection object.
   */
  getFlags(): IFSFlagCollection

  /**
   * Invokes the `decision API` or refers to the `bucketing file` to refresh all campaign flags based on the visitor's context.
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

  /**
   * Starts Collecting Emotion AI events for the visitor.
   */
  collectEAIEventsAsync(): Promise<void>;

  /**
   * Cleans up the visitor instance. This method should be called when the visitor is no longer needed.
   */
  cleanup(): void;
}
