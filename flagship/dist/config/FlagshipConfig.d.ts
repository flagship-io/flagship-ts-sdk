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
    set envId(value: string | undefined);
    get envId(): string | undefined;
    /**
     * Specify the secure api key provided by Flagship, to use.
     */
    set apiKey(value: string | undefined);
    get apiKey(): string | undefined;
    get timeout(): number;
    /**
     * Specify timeout in Milliseconds for api request.
     * Default is 2000ms.
     */
    set timeout(value: number);
    get logLevel(): LogLevel;
    /**
     * Set the maximum log level to display
     */
    set logLevel(value: LogLevel);
    /**
     * Define a callable in order to get callback when the SDK status has changed.
     */
    setStatusChangedCallback(fn: ((status: FlagshipStatus) => void) | undefined): void;
    getStatusChangedCallback(): ((status: FlagshipStatus) => void) | undefined;
    get logManager(): IFlagshipLogManager;
    /** Specify a custom implementation of LogManager in order to receive logs from the SDK. */
    set logManager(value: IFlagshipLogManager);
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
    protected constructor(envId?: string, apiKey?: string);
    set envId(value: string | undefined);
    get envId(): string | undefined;
    set apiKey(value: string | undefined);
    get apiKey(): string | undefined;
    get decisionMode(): DecisionMode;
    get timeout(): number;
    set timeout(value: number);
    get logLevel(): LogLevel;
    set logLevel(value: LogLevel);
    setStatusChangedCallback(fn: ((status: FlagshipStatus) => void) | undefined): void;
    getStatusChangedCallback(): ((status: FlagshipStatus) => void) | undefined;
    get logManager(): IFlagshipLogManager;
    set logManager(value: IFlagshipLogManager);
}
