import { type IFlagshipConfig } from '../config/IFlagshipConfig'
import { FSFetchReasons } from '../enum/FSFetchReasons'
import { LogLevel, VISITOR_SYNC_FLAGS_MESSAGE } from '../enum/index'

/**
 * Return a formatted string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sprintf (format: string, ...value: any[]): string {
  let formatted = format
  for (let i = 0; i < value.length; i++) {
    const item = value[i]
    const element = typeof item === 'string' ? item : JSON.stringify(item instanceof Map ? Array.from(item.values()) : item)
    formatted = formatted.replace(new RegExp(`\\{${i}\\}`, 'g'), element)
  }
  return formatted
}

export function logErrorSprintf (config: IFlagshipConfig, tag: string, message: string, ...arg: unknown[]) {
  if (!config || !config.logLevel || config.logLevel < LogLevel.ERROR) {
    return
  }
  const customMessage = sprintf(message, ...arg)
  logError(config, customMessage, tag)
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

export function logWarningSprintf (config: IFlagshipConfig, tag: string, message: string, ...arg: unknown[]) {
  if (!config || !config.logLevel || config.logLevel < LogLevel.WARNING) {
    return
  }
  const customMessage = sprintf(message, ...arg)
  logWarning(config, customMessage, tag)
}

export function logWarning (
  config: IFlagshipConfig,
  message: string,
  tag: string
):void {
  if (!config || !config.logLevel || config.logLevel < LogLevel.WARNING) {
    return
  }

  if (typeof config.onLog === 'function') {
    config.onLog(LogLevel.WARNING, tag, message)
  }

  if (config.logManager && typeof config.logManager.warning === 'function') {
    config.logManager.warning(message, tag)
  }
}

export function logInfoSprintf (config: IFlagshipConfig, tag: string, message: string, ...arg: unknown[]) {
  if (!config || !config.logLevel || config.logLevel < LogLevel.INFO) {
    return
  }
  const customMessage = sprintf(message, ...arg)
  logInfo(config, customMessage, tag)
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

export function logDebugSprintf (config: IFlagshipConfig, tag: string, message: string, ...arg: unknown[]):void {
  if (!config || !config.logLevel || config.logLevel < LogLevel.DEBUG) {
    return
  }
  const customMessage = sprintf(message, ...arg)
  logDebug(config, customMessage, tag)
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

export function uuidV4 (): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
    const rand = Math.random() * 16 | 0
    const value = char === 'x' ? rand : (rand & 0x3 | 0x8)
    return value.toString(16)
  })
}

export function errorFormat (message:string, errorData?:Record<string, unknown>):string {
  return JSON.stringify({
    message,
    data: errorData
  })
}

export function visitorFlagSyncStatusMessage (reason: FSFetchReasons) {
  let message = ''
  switch (reason) {
    case FSFetchReasons.VISITOR_CREATED:
      message = `Visitor \`{0}\` has been created ${VISITOR_SYNC_FLAGS_MESSAGE}`
      break
    case FSFetchReasons.UPDATE_CONTEXT:
      message = `Visitor context for visitor \`{0}\` has been updated ${VISITOR_SYNC_FLAGS_MESSAGE}`
      break
    case FSFetchReasons.AUTHENTICATE:
      message = `Visitor \`{0}\` has been authenticated ${VISITOR_SYNC_FLAGS_MESSAGE}`
      break
    case FSFetchReasons.UNAUTHENTICATE :
      message = `Visitor \`{0}\` has been unauthenticated ${VISITOR_SYNC_FLAGS_MESSAGE}`
      break
    case FSFetchReasons.FETCH_ERROR:
      message = 'There was an error while fetching flags for visitor `{0}`. So the value of the flag `{1}` may be outdated"'
      break
    case FSFetchReasons.READ_FROM_CACHE:
      message = 'Flags for visitor `{0}` have been fetched from cache'
      break
    default:
      break
  }
  return message
}

export function valueToHex (value: { v: unknown }) {
  const jsonString = JSON.stringify(value)
  const hex = Array.from(jsonString, char => char.charCodeAt(0).toString(16)).join('')
  return hex
}
