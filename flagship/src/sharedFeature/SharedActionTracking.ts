import { EventCategory, Event as EventHit } from '../hit'
import { SharedAction, SharedActionPayload } from '../type.local'
import { isBrowser } from '../utils/utils'
import { VisitorAbstract } from '../visitor/VisitorAbstract'
import { ISharedActionTracking } from './ISharedActionTracking'

export class SharedActionTracking implements ISharedActionTracking {
  private visitor: VisitorAbstract | null = null
  private static handleMessage: (event: MessageEvent<SharedActionPayload>) => void
  protected trustedNonces: Record<string, boolean>
  protected initTimestamp?: number

  public constructor () {
    this.trustedNonces = {}
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

    if (SharedActionTracking.handleMessage) {
      window?.removeEventListener('message', SharedActionTracking.handleMessage)
    }
    SharedActionTracking.handleMessage = (event: MessageEvent<SharedActionPayload>) => {
      this.handleMessage(event)
    }
    window?.addEventListener('message', SharedActionTracking.handleMessage)
  }

  private handleMessage (event: MessageEvent<SharedActionPayload>): void {
    if (!event || !event.data || !event.origin || event.origin !== window.location.origin || !this.visitor) {
      return
    }

    const payload = event.data

    if (payload.action !== SharedAction.ABT_WEB_SDK_TRACK_ACTION || !payload.nonce) {
      return
    }

    const { nonce } = payload

    if (this.trustedNonces[nonce]) {
      return
    }

    this.trustedNonces[nonce] = true

    const hit = payload.data

    if (!hit || hit.ec !== EventCategory.ACTION_TRACKING || !hit.ea) {
      return
    }

    const eventHit = new EventHit({
      category: hit.ec as EventCategory,
      action: hit.ea,
      label: hit.el,
      value: hit.ev,
      visitorId: this.visitor.visitorId
    })

    this.visitor.dispatchHit(eventHit)
  }

  dispatchEventHit (hit: EventHit): void {
    if (!isBrowser() || !this.visitor || hit?.category !== EventCategory.ACTION_TRACKING) {
      return
    }

    const isHitPostInit = this.initTimestamp && hit.createdAt >= this.initTimestamp
    const isHitFromVisitor = hit.visitorId === this.visitor.visitorId
    if (!isHitFromVisitor || !isHitPostInit) {
      return
    }

    const nonce = Date.now().toString() // Will be replaced by a real nonce generator from tag API

    const payload: SharedActionPayload = {
      action: SharedAction.ABT_TAG_TRACK_ACTION,
      data: {
        ec: 'Action Tracking',
        ea: hit.action,
        ev: hit.value,
        el: hit.label
      },
      nonce,
      timestamp: Date.now()
    }

    window?.postMessage(payload, window.location.origin)
  }
}
