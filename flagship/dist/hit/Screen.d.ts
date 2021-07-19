import { HitAbstract } from './HitAbstract';
export declare const ERROR_MESSAGE = "Screen name is required";
export declare class Screen extends HitAbstract {
    private _screenName;
    get screenName(): string;
    set screenName(v: string);
    constructor(screenName: string);
    isReady(): boolean;
    toApiKeys(): any;
    getErrorMessage(): string;
}
