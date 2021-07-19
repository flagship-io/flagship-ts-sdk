import { LogLevel } from '../enum/index';
export interface IFlagshipLogManager {
    /**
     *System is unusable.
     * @param message
     * @param tag
     */
    emergency(message: string, tag: string): void;
    alert(message: string, tag: string): void;
    critical(message: string, tag: string): void;
    error(message: string, tag: string): void;
    warning(message: string, tag: string): void;
    notice(message: string, tag: string): void;
    info(message: string, tag: string): void;
    debug(message: string, tag: string): void;
    log(level: LogLevel, message: string, tag: string): void;
}
export declare class FlagshipLogManager implements IFlagshipLogManager {
    emergency(message: string, tag: string): void;
    alert(message: string, tag: string): void;
    critical(message: string, tag: string): void;
    error(message: string, tag: string): void;
    warning(message: string, tag: string): void;
    notice(message: string, tag: string): void;
    info(message: string, tag: string): void;
    debug(message: string, tag: string): void;
    log(level: LogLevel, message: string, tag: string): void;
}
