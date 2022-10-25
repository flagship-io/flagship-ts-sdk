import { IFlagshipConfig } from '../config/FlagshipConfig'
import { LogLevel } from '../enum/index'

/**
 * Return a formatted string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sprintf (format: string, ...value: any[]): string {
  let formatted = format
  for (let i = 0; i < value.length; i++) {
    const element = value[i]
    formatted = formatted.replace(new RegExp(`\\{${i}\\}`, 'g'), element)
  }
  return formatted
}

export function logError (
  config: IFlagshipConfig,
  message: string,
  tag: string
):void {
  if (!config || !config.logLevel || config.logLevel < LogLevel.ERROR) {
    return
  }

  if (typeof config.onLog === 'function') {
    config.onLog(LogLevel.ERROR, tag, message)
  }

  if (config.logManager && typeof config.logManager.error === 'function') {
    config.logManager.error(message, tag)
  }
}

export function logInfo (config: IFlagshipConfig, message: string, tag: string):void {
  if (!config || !config.logLevel || config.logLevel < LogLevel.INFO) {
    return
  }

  if (typeof config.onLog === 'function') {
    config.onLog(LogLevel.INFO, tag, message)
  }

  if (config.logManager && typeof config.logManager.info === 'function') {
    config.logManager.info(message, tag)
  }
}

export function logDebug (config: IFlagshipConfig, message: string, tag: string):void {
  if (!config || !config.logLevel || config.logLevel < LogLevel.DEBUG) {
    return
  }

  if (typeof config.onLog === 'function') {
    config.onLog(LogLevel.DEBUG, tag, message)
  }

  if (config.logManager && typeof config.logManager.debug === 'function') {
    config.logManager.debug(message, tag)
  }
}

export function sleep (ms:number) :Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isBrowser ():boolean {
  return typeof window !== 'undefined' && !('Deno' in window)
}

export function hasSameType (flagValue:unknown, defaultValue:unknown):boolean {
  if (typeof flagValue !== typeof defaultValue) {
    return false
  }
  if (typeof flagValue === 'object' && typeof defaultValue === 'object' &&
  Array.isArray(flagValue) !== Array.isArray(defaultValue)
  ) {
    return false
  }
  return true
}

export function errorFormat (errorMessage:string, errorData?:Record<string, unknown>):string {
  return JSON.stringify({
    errorMessage,
    data: errorData
  })
}
