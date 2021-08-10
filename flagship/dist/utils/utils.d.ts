import { IFlagshipConfig } from '../config/FlagshipConfig';
/**
 * Return a formatted string
 */
export declare function sprintf(format: string, ...value: any[]): string;
export declare function logError(config: IFlagshipConfig, message: string, tag: string): void;
export declare function logInfo(config: IFlagshipConfig, message: string, tag: string): void;
export declare function sleep(ms: number): Promise<unknown>;
