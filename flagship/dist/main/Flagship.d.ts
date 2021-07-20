import { Visitor } from '../visitor/Visitor';
import { FlagshipStatus } from '../enum/FlagshipStatus';
import { IFlagshipConfig } from '../config/FlagshipConfig';
export declare class Flagship {
    private static _instance;
    private _configManger;
    private _config;
    private _status;
    get config(): IFlagshipConfig;
    private set configManager(value);
    private get configManager();
    private constructor();
    protected static getInstance(): Flagship;
    /**
     * Return true if the SDK is properly initialized, otherwise return false
     */
    private static isReady;
    protected setStatus(status: FlagshipStatus): void;
    /**
     * Return current status of Flagship SDK.
     */
    static getStatus(): FlagshipStatus;
    /**
     * Return the current config set by the customer and used by the SDK.
     */
    static getConfig(): IFlagshipConfig;
    /**
     * Start the flagship SDK, with a custom configuration implementation
     * @param {string} envId : Environment id provided by Flagship.
     * @param {string} apiKey : Secure api key provided by Flagship.
     * @param {IFlagshipConfig} config : (optional) SDK configuration.
     */
    static start(envId: string, apiKey: string, config?: IFlagshipConfig): void;
    /**
     * Create a new visitor with a context.
     * @param {string} visitorId : Unique visitor identifier.
     * @param {Record<string, string | number | boolean>} context : visitor context. e.g: { isVip: true, country: "UK" }.
     * @returns {Visitor} a new visitor instance
     */
    static newVisitor(visitorId: string, context?: Record<string, string | number | boolean>): Visitor | null;
}