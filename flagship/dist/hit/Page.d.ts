import { HitAbstract } from './HitAbstract';
export declare const ERROR_MESSAGE = "Page url is required";
export declare class Page extends HitAbstract {
    private _pageUrl;
    get pageUrl(): string;
    set pageUrl(v: string);
    constructor(pageUrl: string);
    isReady(): boolean;
    toApiKeys(): any;
    getErrorMessage(): string;
}
