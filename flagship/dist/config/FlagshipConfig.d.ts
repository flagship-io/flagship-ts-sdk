import { FlagshipStatus, LogLevel } from '../enum/index';
import { IFlagshipLogManager } from '../utils/FlagshipLogManager';
export declare enum DecisionMode {
    /**
     * Flagship SDK mode decision api
     */
    DECISION_API = 0,
    /**
     * Flagship SDK mode bucketing
     */
    BUCKETING = 1
}
export interface IFlagshipConfig {
    /**
     * Specify the environment id provided by Flagship, to use.
     */
    envId?: string;
    /**
     * Specify the secure api key provided by Flagship, to use.
     */
    apiKey?: string;
    /**
     * Specify timeout in seconds for api request.
     * Default is 2000ms.
     */
    timeout?: number;
    /**
     * Set the maximum log level to display
     */
    logLevel?: LogLevel;
    /**
     * Specify the SDK running mode.
     * BUCKETING or DECISION_API
     */
    decisionMode: DecisionMode;
    /**
     * Define a callable in order to get callback when the SDK status has changed.
     */
    statusChangedCallback?: (status: FlagshipStatus) => void;
    /** Specify a custom implementation of LogManager in order to receive logs from the SDK. */
    logManager?: IFlagshipLogManager;
    /**
     * Decide to fetch automatically modifications data when creating a new FlagshipVisitor
     */
    fetchNow?: boolean;
}
export declare const statusChangeError = "statusChangedCallback must be a function";
export declare abstract class FlagshipConfig implements IFlagshipConfig {
    private _envId?;
    private _apiKey?;
    protected _decisionMode: DecisionMode;
    private _timeout;
    private _logLevel;
    private _statusChangedCallback?;
    private _logManager;
    private _fetchNow;
    protected constructor(param: IFlagshipConfig);
    set envId(value: string | undefined);
    get envId(): string | undefined;
    set apiKey(value: string | undefined);
    get apiKey(): string | undefined;
    get decisionMode(): DecisionMode;
    get timeout(): number;
    set timeout(value: number);
    get logLevel(): LogLevel;
    set logLevel(value: LogLevel);
    get fetchNow(): boolean;
    set fetchNow(v: boolean);
    get statusChangedCallback(): ((status: FlagshipStatus) => void) | undefined;
    set statusChangedCallback(fn: ((status: FlagshipStatus) => void) | undefined);
    get logManager(): IFlagshipLogManager;
    set logManager(value: IFlagshipLogManager);
}
