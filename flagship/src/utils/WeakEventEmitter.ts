
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (...args: any[]) => void

export class WeakEventEmitter {
  private weakListeners: Map<string | symbol, Set<WeakRef<Listener> | (Listener)>>

  constructor () {
    this.weakListeners = new Map()
  }

  public on (event: string | symbol, listener: Listener): void {
    if (!this.weakListeners.has(event)) {
      this.weakListeners.set(event, new Set())
    }
    const ref = typeof WeakRef !== 'undefined' ? new WeakRef(listener) : listener
    this.weakListeners.get(event)?.add(ref)
  }

  public off (event: string | symbol, listener: Listener): void {
    const listeners = this.weakListeners.get(event)
    if (listeners) {
      for (const ref of listeners) {
        const refListener = typeof WeakRef !== 'undefined' && ref instanceof WeakRef ? ref.deref() : ref
        if (refListener === listener) {
          listeners.delete(ref)
          break
        }
      }
      if (listeners.size === 0) {
        this.weakListeners.delete(event)
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public emit (event: string | symbol, ...args: any[]): boolean {
    const listeners = this.weakListeners.get(event)
    if (!listeners) {
      return false
    }
    for (const ref of listeners) {
      const listener = typeof WeakRef !== 'undefined' && ref instanceof WeakRef ? ref.deref() : ref as Listener
      if (listener) {
        listener(...args)
      } else if (typeof WeakRef !== 'undefined' && ref instanceof WeakRef) {
        listeners.delete(ref)
      }
    }
    if (listeners.size === 0) {
      this.weakListeners.delete(event)
    }
    return true
  }
}
