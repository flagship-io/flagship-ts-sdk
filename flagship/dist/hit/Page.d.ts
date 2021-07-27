import { HitAbstract, IHitAbstract } from './HitAbstract';
export declare const ERROR_MESSAGE = "documentLocation url is required";
export interface IPage extends IHitAbstract {
    documentLocation: string;
}
export declare class Page extends HitAbstract implements IPage {
    private _documentLocation;
    get documentLocation(): string;
    set documentLocation(v: string);
    constructor(page: Omit<IPage, 'type'>);
    isReady(): boolean;
    toApiKeys(): any;
    getErrorMessage(): string;
}
