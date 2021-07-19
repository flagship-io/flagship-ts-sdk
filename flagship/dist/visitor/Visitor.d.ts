import { Modification } from '../model/Modification';
import { HitAbstract } from '../hit/index';
import { IConfigManager, IFlagshipConfig } from '../config/index';
export declare class Visitor {
    private _visitorId;
    private _context;
    private _modifications;
    private _configManager;
    private _config;
    constructor(visitorId: string, context: Record<string, string | number | boolean>, configManager: IConfigManager);
    get visitorId(): string;
    set visitorId(v: string);
    get context(): Record<string, string | number | boolean>;
    /**
     * Clear the current context and set a new context value
     */
    set context(v: Record<string, string | number | boolean>);
    get modifications(): Map<string, Modification>;
    get configManager(): IConfigManager;
    get config(): IFlagshipConfig;
    /**
     * Update the visitor context values, matching the given keys, used for targeting.
     *
     * A new context value associated with this key will be created if there is no previous matching value.
     *
     * Context keys must be String, and values types must be one of the following : Number, Boolean, String.
     * @param {Record<string, string | number | boolean>} context : collection of keys, values.
     */
    updateContext(context: Record<string, string | number | boolean>): void;
    /**
     *  Update the visitor context values, matching the given keys, used for targeting.
     *
     * A new context value associated with this key will be created if there is no previous matching value.
     * Context key must be String, and value type must be one of the following : Number, Boolean, String.
     * @param {string} key : context key.
     * @param {string | number | boolean} value : context value.
     */
    updateContextKeyValue(key: string, value: string | number | boolean): void;
    /**
     * clear the actual visitor context
     */
    clearContext(): void;
    /**
     * isOnPanicMode
     */
    private isOnPanicMode;
    /**
     * Retrieve a modification value by its key. If no modification match the given
     * key or if the stored value type and default value type do not match, default value will be returned.
     * @param {string} key : key associated to the modification.
     * @param {T} defaultValue : default value to return.
     * @param {boolean} activate : Set this parameter to true to automatically report on our server that the current visitor has seen this modification. It is possible to call activateModification() later.
     */
    getModificationAsync<T>(key: string, defaultValue: T, activate?: boolean): Promise<T>;
    /**
     * Retrieve a modification value by its key. If no modification match the given
     * key or if the stored value type and default value type do not match, default value will be returned.
     * @param {string} key : key associated to the modification.
     * @param {T} defaultValue : default value to return.
     * @param {boolean} activate : Set this parameter to true to automatically report on our server that the current visitor has seen this modification. It is possible to call activateModification() later.
     */
    getModification<T>(key: string, defaultValue: T, activate?: boolean): T;
    /**
     * Get the campaign modification information value matching the given key.
     * @param {string} key : key which identify the modification.
     * @returns {Modification | null}
     */
    getModificationInfoAsync(key: string): Promise<Modification | null>;
    /**
     * Get the campaign modification information value matching the given key.
     * @param {string} key : key which identify the modification.
     * @returns {Modification | null}
     */
    getModificationInfo(key: string): Modification | null;
    /**
     * This function calls the decision api and update all the campaigns modifications
     * from the server according to the visitor context.
     */
    synchronizeModifications(): Promise<void>;
    private hasTrackingManager;
    /**
     * Report this user has seen this modification.
     * @param key : key which identify the modification to activate.
     */
    activateModificationAsync(key: string): Promise<void>;
    /**
     * Report this user has seen this modification.
     * @param key : key which identify the modification to activate.
     */
    activateModification(key: string): void;
    /**
     * Send a Hit to Flagship servers for reporting.
     * @param hit
     */
    sendHitAsync(hit: HitAbstract): Promise<void>;
    /**
     * Send a Hit to Flagship servers for reporting.
     * @param hit
     */
    sendHit(hit: HitAbstract): void;
}
