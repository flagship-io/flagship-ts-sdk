/* eslint-disable no-console */
import {  LogLevel } from '../enum/index';
import { formatLogOutput } from './utils';

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

export class FlagshipLogManager implements IFlagshipLogManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  consoleError: { (...data: any[]): void; (message?: any, ...optionalParams: any[]): void; };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  consoleWarn: { (...data: any[]): void; (message?: any, ...optionalParams: any[]): void; };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  consoleDebug: { (...data: any[]): void; (message?: any, ...optionalParams: any[]): void; };

  constructor() {
    this.consoleError = console.error ?? console.log;
    this.consoleWarn = console.warn ?? console.log;
    this.consoleDebug = console.debug ?? console.log;
  }

  emergency(message: string, tag: string): void {
    this.consoleError(formatLogOutput(LogLevel.EMERGENCY, message, tag));
  }

  alert(message: string, tag: string): void {
    this.consoleError(formatLogOutput(LogLevel.ALERT, message, tag));
  }

  critical(message: string, tag: string): void {
    this.consoleError(formatLogOutput(LogLevel.CRITICAL, message, tag));
  }

  error(message: string, tag: string): void {
    this.consoleError(formatLogOutput(LogLevel.ERROR, message, tag));
  }

  warning(message: string, tag: string): void {
    this.consoleWarn(formatLogOutput(LogLevel.WARNING, message, tag));
  }

  notice(message: string, tag: string): void {
    this.log(LogLevel.NOTICE, message, tag);
  }

  info(message: string, tag: string): void {
    console.info(formatLogOutput(LogLevel.INFO, message, tag));
  }

  debug(message: string, tag: string): void {
    this.consoleDebug(formatLogOutput(LogLevel.DEBUG, message, tag));
  }

  log(level: LogLevel, message: string, tag: string): void {
    console.log(formatLogOutput(level, message, tag));
  }

}
