import { sendVisitorAllocatedVariations, sendVisitorExposedVariations } from './index.ts'
import { FS_FORCED_VARIATIONS, FS_IS_QA_MODE_ENABLED, FS_QA_ASSISTANT_SCRIPT_TAG_ID, SDK_INFO } from '../../enum/FlagshipConstant.ts'
import { FsVariationToForce } from '../../types.ts'
import { EventDataFromIframe, INTERNAL_EVENTS } from '../type.ts'
import { IFlagshipConfig } from '../../config/IFlagshipConfig.ts'

export function onQaAssistantReady () {
  if (window.flagship?.visitorVariations) {
    sendVisitorAllocatedVariations(window.flagship?.visitorVariations)
  }
  if (window.flagship?.exposedVariations) {
    sendVisitorExposedVariations(window.flagship?.exposedVariations)
  }
}

export function render () {
  if (SDK_INFO.name === 'TypeScript') {
    document.location.reload()
  }
  const triggerRenderEvent = new CustomEvent(INTERNAL_EVENTS.FsTriggerRendering)
  window.dispatchEvent(triggerRenderEvent)
}

export function onQaAssistantClose ({ config, func }:{config:IFlagshipConfig, func?: (event: MessageEvent<EventDataFromIframe>) => void}) {
  config.isQAModeEnabled = false
  sessionStorage.removeItem(FS_IS_QA_MODE_ENABLED)
  if (func) {
    window.removeEventListener('message', func)
  }
  document.getElementById(FS_QA_ASSISTANT_SCRIPT_TAG_ID)?.remove()

  window.flagship = {
    ...window.flagship,
    forcedVariations: {}
  }
  render()
}

export function onApplyForcedVariations ({ value }:{ value:Record<string, FsVariationToForce>}) {
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
  render()
}

export function onResetForcedVariations () {
  sessionStorage.removeItem(FS_FORCED_VARIATIONS)

  window.flagship = {
    ...window.flagship,
    forcedVariations: {}
  }

  render()
}
