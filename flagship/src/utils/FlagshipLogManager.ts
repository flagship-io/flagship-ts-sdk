/* eslint-disable no-console */
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  consoleDebug: { (...data: any[]): void; (message?: any, ...optionalParams: any[]): void; }

  constructor () {
    this.consoleError = console.error ?? console.log
    this.consoleWarn = console.warn ?? console.log
    this.consoleDebug = console.debug ?? console.log
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
    this.consoleDebug(this.formatOutput(LogLevel.DEBUG, message, tag))
  }

  log (level: LogLevel, message: string, tag: string): void {
    console.log(this.formatOutput(level, message, tag))
  }

  protected formatOutput(level: LogLevel, message: string, tag: string): string {
    const now = new Date()
    
    const formatTwoDigits = (value: number): string => {
      return value.toString().padStart(2, '0')
    }
    
    const formatMilliseconds = (value: number): string => {
      return value.toString().padStart(3, '0')
    }
    
    const colorCodes: Record<LogLevel, string> = {
      [LogLevel.EMERGENCY]: '\x1b[1;37;41m',
      [LogLevel.ALERT]: '\x1b[1;37;45m',
      [LogLevel.CRITICAL]: '\x1b[1;37;41m',
      [LogLevel.ERROR]: '\x1b[1;37;41m',
      [LogLevel.WARNING]: '\x1b[33;1m',
      [LogLevel.NOTICE]: '\x1b[36;1m',
      [LogLevel.INFO]: '\x1b[32;1m',
      [LogLevel.DEBUG]: '\x1b[90;1m',
      [LogLevel.NONE]: '',
      [LogLevel.ALL]: '\x1b[90;1m',
    }
  
    const resetColor = '\x1b[0m'
    const colorCode = colorCodes[level] || ''
  
    const year = now.getFullYear()
    const month = formatTwoDigits(now.getMonth() + 1)
    const day = formatTwoDigits(now.getDate())
    const hours = formatTwoDigits(now.getHours())
    const minutes = formatTwoDigits(now.getMinutes())
    const seconds = formatTwoDigits(now.getSeconds())
    const milliseconds = formatMilliseconds(now.getMilliseconds())
    
    const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
    
    const levelName = LogLevel[level].padEnd(2)
    
    return `${colorCode}[${timestamp}] [${FLAGSHIP_SDK}] [${levelName}] [${tag}] ${message}${resetColor}`
  }
}
