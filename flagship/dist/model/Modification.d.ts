export declare class Modification {
    private _key;
    private _campaignId;
    private _variationGroupId;
    private _variationId;
    private _isReference;
    private _value;
    constructor(key: string, campaignId: string, variationGroupId: string, variationId: string, isReference: boolean, value: unknown);
    get key(): string;
    get campaignId(): string;
    get variationGroupId(): string;
    get variationId(): string;
    get isReference(): boolean;
    get value(): any;
}
