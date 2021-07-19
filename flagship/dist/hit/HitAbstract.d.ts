import { IFlagshipConfig } from '../config/FlagshipConfig';
import { HitType } from '../enum/HitType';
export declare abstract class HitAbstract {
    private _visitorId;
    private _config;
    private _hitType;
    private _ds;
    get visitorId(): string;
    set visitorId(v: string);
    get ds(): string;
    set ds(v: string);
    protected get hitType(): HitType;
    protected set hitType(v: HitType);
    get config(): IFlagshipConfig;
    set config(v: IFlagshipConfig);
    protected constructor(type: HitType);
    /**
     * Return true if value is a string and not empty, otherwise return false
     * @param value
     * @param itemName
     * @returns
     */
    protected isNotEmptyString(value: unknown, itemName: string): boolean;
    protected isNumeric(value: unknown, itemName: string): boolean;
    protected isInteger(value: unknown, itemName: string): boolean;
    /**
     * Return an object with Api parameters as keys
     */
    toApiKeys(): any;
    /**
     * Return true if all required attributes are given, otherwise return false
     */
    isReady(): boolean;
    /**
     * This function return the error message according to required attributes of class
     *
     */
    abstract getErrorMessage(): string;
}
