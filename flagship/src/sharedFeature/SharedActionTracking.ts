import { IFlagshipConfig } from '../config/IFlagshipConfig'
import { ACTION_TRACKING, ACTION_TRACKING_DISPATCHED, ACTION_TRACKING_HIT_RECEIVED, ACTION_TRACKING_INVALID_HIT, ACTION_TRACKING_INVALID_NONCE } from '../enum/FlagshipConstant'
import { EventCategory, Event as EventHit } from '../hit'
import { ActionTrackingData, LocalActionTracking, SharedAction, SharedActionPayload, SharedActionTrackingParam } from '../type.local'
import { isBrowser, logDebugSprintf } from '../utils/utils'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { ISharedActionTracking } from './ISharedActionTracking'

export class SharedActionTracking implements ISharedActionTracking {
  private visitor: VisitorAbstract | null = null
  private onMessageReceived?: (event: MessageEvent<SharedActionPayload>) => void
  protected trustedNonces: Record<string, boolean>
  protected initTimestamp?: number
  protected sdkConfig: IFlagshipConfig

  public constructor ({ sdkConfig }:SharedActionTrackingParam) {
    this.trustedNonces = {}
    this.sdkConfig = sdkConfig
  }

  public generateNonce (): string {
    if (!isBrowser()) {
      return ''
    }
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36)
    this.trustedNonces[nonce] = false
    return nonce
  }

  initialize (visitor: VisitorAbstract): void {
    this.visitor = visitor
    this.initTimestamp = Date.now()

    if (!isBrowser()) {
      return
    }

    if (this.onMessageReceived) {
      window?.removeEventListener('message', this.onMessageReceived)
    }
    this.onMessageReceived = (event: MessageEvent<SharedActionPayload>) => {
      this.handleMessage(event)
    }
    window?.addEventListener('message', this.onMessageReceived)
  }

  protected processHit (hit: ActionTrackingData): void {
    if (!this.visitor || hit?.ec !== EventCategory.ACTION_TRACKING || !hit.ea) {
      logDebugSprintf(this.sdkConfig, ACTION_TRACKING, ACTION_TRACKING_INVALID_HIT, hit)
      return
    }

    const eventHit = new EventHit({
      category: hit.ec as EventCategory,
      action: hit.ea,
      label: hit.el,
      value: hit.ev,
      visitorId: this.visitor.visitorId,
      anonymousId: this.visitor.anonymousId,
      isActionTrackingHit: true
    })

    this.visitor.addInTrackingManager(eventHit)

    logDebugSprintf(this.sdkConfig, ACTION_TRACKING, ACTION_TRACKING_HIT_RECEIVED, hit)
  }

  private handleMessage (event: MessageEvent<SharedActionPayload>): void {
    if (!event || !event.data || !event.origin || event.origin !== window.location.origin || !this.visitor) {
      return
    }

    const payload = event.data

    if (payload.action !== SharedAction.ABT_TAG_TRACK_ACTION || !payload.nonce) {
      return
    }

    const { nonce } = payload

    if (this.trustedNonces[nonce] === undefined || this.trustedNonces[nonce]) {
      logDebugSprintf(this.sdkConfig, ACTION_TRACKING, ACTION_TRACKING_INVALID_NONCE, nonce)
      return
    }

    this.trustedNonces[nonce] = true

    const hits = payload.data

    if (!hits || !hits.length) {
      return
    }

    for (const hit of hits) {
      this.processHit(hit)
    }
  }

  dispatchEventHits (hits: LocalActionTracking[]): void {
    if (!isBrowser() || !this.visitor || !hits || !hits.length) {
      return
    }

    const hitsToDispatch:ActionTrackingData[] = []

    for (const hit of hits) {
      const isHitPostInit = this.initTimestamp && hit.createdAt >= this.initTimestamp
      const isHitForVisitor = hit.visitorId === this.visitor?.visitorId
      if (hit.data.ec === EventCategory.ACTION_TRACKING && isHitPostInit && isHitForVisitor) {
        hitsToDispatch.push(hit.data)
      }
    }

    if (!hitsToDispatch.length) {
      return
    }

    const nonce = Date.now().toString() // Will be replaced by a real nonce generator from tag API

    const payload: SharedActionPayload = {
      action: SharedAction.ABT_WEB_SDK_TRACK_ACTION,
      data: hitsToDispatch,
      nonce,
      timestamp: Date.now()
    }

    window?.postMessage(payload, window.location.origin)

    logDebugSprintf(this.sdkConfig, ACTION_TRACKING, ACTION_TRACKING_DISPATCHED, hitsToDispatch)
  }
}
