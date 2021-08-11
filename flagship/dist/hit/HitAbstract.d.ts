import { IFlagshipConfig } from '../config/FlagshipConfig';
import { HitType } from '../enum/HitType';
export interface IHitAbstract {
    visitorId?: string;
    ds?: string;
    type: HitType;
}
export declare abstract class HitAbstract implements IHitAbstract {
    private _visitorId;
    private _config;
    private _type;
    private _ds;
    private _anonymousId;
    get anonymousId(): string | null;
    set anonymousId(v: string | null);
    get visitorId(): string;
    set visitorId(v: string);
    get ds(): string;
    set ds(v: string);
    get type(): HitType;
    protected set type(v: HitType);
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
