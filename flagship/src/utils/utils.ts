import { IFlagshipConfig } from "../config/FlagshipConfig.ts";

/**
 * Return a formatted string
 */
// deno-lint-ignore no-explicit-any
export function sprintf(format: string, ...value: any[]): string {
  let formatted = format;
  for (let i = 0; i < value.length; i++) {
    const element = value[i];
    formatted = format.replace(`{${i}}`, element);
  }
  return formatted;
}

export function logError(
  config: IFlagshipConfig,
  message: string,
  tag: string
) {
  if (!config || !config.logManager) {
    return;
  }
  config.logManager.error(message, tag);
}

export function logInfo(config: IFlagshipConfig, message: string, tag: string) {
  if (!config || !config.logManager) {
    return;
  }
  config.logManager.info(message, tag);
}
