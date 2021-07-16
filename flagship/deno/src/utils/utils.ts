import { IFlagshipConfig } from '../config/FlagshipConfig.ts'
import { LogLevel } from '../enum/index.ts'
import { IFlagshipConfig } from '../config/FlagshipConfig.ts'
import { LogLevel } from '../enum/index.ts'

/**
 * Return a formatted string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sprintf (format: string, ...value: any[]): string {
  let formatted = format
  for (let i = 0; i < value.length; i++) {
    const element = value[i]
    formatted = formatted.replace(`{${i}}`, element)
  }
  return formatted
}

export function logError (
  config: IFlagshipConfig,
  message: string,
  tag: string
):void {
  if (
    !config ||
    !config.logManager ||
    typeof config.logManager.error !== 'function' ||
    config.logLevel < LogLevel.ERROR
  ) {
    return
  }
  config.logManager.error(message, tag)
}

export function logInfo (config: IFlagshipConfig, message: string, tag: string):void {
  if (
    !config ||
    !config.logManager ||
    typeof config.logManager.info !== 'function' ||
    config.logLevel < LogLevel.INFO
  ) {
    return
  }
  config.logManager.info(message, tag)
}
