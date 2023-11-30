
import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { FS_FORCED_VARIATIONS, FS_IS_QA_MODE_ENABLED, SDK_INFO } from '../enum/FlagshipConstant'
import { FsVariationToForce } from '../types'
import { isBrowser } from '../utils/utils'
import { EventDataFromIframe, MSG_NAME_FROM_IFRAME } from './type'

export function handleIframeMessage ({ event, config, func }: { event: MessageEvent<EventDataFromIframe>, config: IFlagshipConfig, func?: (event: MessageEvent<EventDataFromIframe>) => void }) {
  if (!config.isQAModeEnabled || !isBrowser()) {
    return
  }
  switch (event.data.name) {
    case MSG_NAME_FROM_IFRAME.QaAssistantClose:
      onQaAssistantClose({ config, func })
      break
    case MSG_NAME_FROM_IFRAME.FsApplyForcedVariations:
      onApplyForcedVariations({ value: event.data.value })
      break
    case MSG_NAME_FROM_IFRAME.FsResetForcedVariations:
      onResetForcedVariations()
      break
    default:
      break
  }
}

function onQaAssistantClose ({ config, func }:{config:IFlagshipConfig, func?: (event: MessageEvent<EventDataFromIframe>) => void}) {
  config.isQAModeEnabled = false
  sessionStorage.removeItem(FS_IS_QA_MODE_ENABLED)
  if (func) {
    window.removeEventListener('message', func)
  }
}

function onApplyForcedVariations ({ value }:{ value:Record<string, FsVariationToForce>}) {
  const sessionForcedVariations = sessionStorage.getItem(FS_FORCED_VARIATIONS)
  let forcedVariations: Record<string, FsVariationToForce> = {}
  try {
    forcedVariations = JSON.parse(sessionForcedVariations || '{}')
  } catch (error) {
    console.error('Error parsing sessionForcedVariations', error)
  }
  forcedVariations = { ...forcedVariations, ...value }
  sessionStorage.setItem(FS_FORCED_VARIATIONS, JSON.stringify(forcedVariations))

  window.flagship = {
    ...window.flagship,
    forcedVariations
  }
  if (SDK_INFO.name === 'TypeScript') {
    document.location.reload()
  }
}

function onResetForcedVariations () {
  sessionStorage.removeItem(FS_FORCED_VARIATIONS)

  window.flagship = {
    ...window.flagship,
    forcedVariations: {}
  }

  if (SDK_INFO.name === 'TypeScript') {
    document.location.reload()
  }
}
