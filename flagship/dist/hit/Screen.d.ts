import { HitAbstract, IHitAbstract } from './HitAbstract';
export declare const ERROR_MESSAGE = "Screen name is required";
export interface IScreen extends IHitAbstract {
    documentLocation: string;
}
export declare class Screen extends HitAbstract implements IScreen {
    private _documentLocation;
    get documentLocation(): string;
    set documentLocation(v: string);
    constructor(screen: Omit<IScreen, 'type'>);
    isReady(): boolean;
    toApiKeys(): any;
    getErrorMessage(): string;
}
