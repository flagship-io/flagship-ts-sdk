import { FLAGSHIP_SDK, LogLevel } from '../enum/index'

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
  consoleError: { (...data: any[]): void; (message?: any, ...optionalParams: any[]): void; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  consoleWarn: { (...data: any[]): void; (message?: any, ...optionalParams: any[]): void; }
  constructor (isEdge = false) {
    this.consoleError = isEdge ? console.log : console.error
    this.consoleWarn = isEdge ? console.log : console.warn
  }

  emergency (message: string, tag: string): void {
    this.consoleError(this.formatOutput(LogLevel.EMERGENCY, message, tag))
  }

  alert (message: string, tag: string): void {
    this.consoleError(this.formatOutput(LogLevel.ALERT, message, tag))
  }

  critical (message: string, tag: string): void {
    this.consoleError(this.formatOutput(LogLevel.CRITICAL, message, tag))
  }

  error (message: string, tag: string): void {
    this.consoleError(this.formatOutput(LogLevel.ERROR, message, tag))
  }

  warning (message: string, tag: string): void {
    this.consoleWarn(this.formatOutput(LogLevel.WARNING, message, tag))
  }

  notice (message: string, tag: string): void {
    this.log(LogLevel.NOTICE, message, tag)
  }

  info (message: string, tag: string): void {
    console.info(this.formatOutput(LogLevel.INFO, message, tag))
  }

  debug (message: string, tag: string): void {
    console.debug(this.formatOutput(LogLevel.DEBUG, message, tag))
  }

  log (level: LogLevel, message: string, tag: string): void {
    console.log(this.formatOutput(level, message, tag))
  }

  protected formatOutput (level: LogLevel, message: string, tag: string):string {
    const now = new Date(Date.now())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getTwoDigit = (value: any) => {
      return value.toString().length === 1 ? `0${value}` : value
    }

    return `[${getTwoDigit(now.getFullYear())}-${
      getTwoDigit(
        now.getMonth() + 1
      )
    }-${getTwoDigit(now.getDate())} ${
      getTwoDigit(
        now.getHours()
      )
    }:${getTwoDigit(now.getMinutes())}:${getTwoDigit(now.getSeconds())}.${getTwoDigit(now.getMilliseconds())}] [${FLAGSHIP_SDK}] [${
      LogLevel[level]
    }] [${tag}] : ${message}`
  }
}
