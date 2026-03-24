import { EventEmitter } from '../../depsDeno.ts';
import { QAAToSDKEvents, QAEventMap, QAEventSdkName, SDKToQAAEvents } from '../common/types.ts';

/**
 * Global, type-safe Event Bus for QA Assistant ↔ SDK communication.
 * Implements singleton pattern to ensure a single shared instance.
 */
class QAEventBus extends EventEmitter {
  private static instance: QAEventBus;

  /**
   * SDK and QA Assistant modules.
   */
  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Return the singleton instance of the QAEventBus.
   *
   * Usage:
   *   const bus = QAEventBus.getInstance();
   */
  static getInstance(): QAEventBus {
    if (!QAEventBus.instance) {
      QAEventBus.instance = new QAEventBus();
    }
    return QAEventBus.instance;
  }

  /**
   * Emit a QA event (typed across both directions).
   *
   * @template K - Key of QAEventMap
   * @param event - Event name (union of QAAToSDKEvents | SDKToQAAEvents)
   * @param data - Payload associated with the event
   */
  emitQAEvent<K extends keyof QAEventMap>(
    event: K,
    data?: QAEventMap[K]
  ): void {
    this.emit(event, data);
  }

  /**
   * Emit an event originating from the QA Assistant to the SDK.
   *
   * @template K - Key of QAAToSDKEvents
   * @param event - Event name in QAAToSDKEvents
   * @param data - Payload for the SDK listener
   */
  emitQAEventToSDK<K extends keyof QAAToSDKEvents>(
    event: K,
    data?: QAAToSDKEvents[K]
  ): void {
    this.emit(event, data);
  }

  /**
   * Emit an event originating from the SDK to the QA Assistant.
   *
   * @template K - Key of SDKToQAAEvents
   * @param event - Event name in SDKToQAAEvents
   * @param data - Payload for the QA Assistant listener
   */
  emitQAEventToQAA<K extends keyof SDKToQAAEvents>(
    event: K,
    data?: SDKToQAAEvents[K]
  ): void {
    this.emit(event, data);
  }

  /**
   * Register a typed listener for any QA event (both directions).
   *
   * Returns a cleanup function that removes the registered listener.
   *
   * @template K - Key of QAEventMap
   * @param event - Event name
   * @param listener - Callback invoked with the event payload
   * @returns cleanup function to remove this listener
   */
  onQAEvent<K extends keyof QAEventMap>(
    event: K,
    listener: (data: QAEventMap[K]) => void
  ): () => void {
    this.on(event, listener);

    // Return cleanup function
    return () => this.off(event, listener);
  }

  /**
   * Register a typed listener for events coming from the QA Assistant to the SDK.
   *
   * Returns a cleanup function that removes the registered listener.
   *
   * @template K - Key of SDKToQAAEvents
   * @param event - Event name from the QA Assistant
   * @param listener - Callback invoked with the event payload
   * @returns cleanup function to remove this listener
   */
  onQAEventFromSDK<K extends keyof SDKToQAAEvents>(
    event: K,
    listener: (data: SDKToQAAEvents[K]) => void
  ): () => void {
    this.on(event, listener);

    // Return cleanup function
    return () => this.off(event, listener);
  }

  /**
   * Register a typed listener for events coming from the SDK to the QA Assistant.
   *
   * Returns a cleanup function that removes the registered listener.
   *
   * @template K - Key of QAAToSDKEvents
   * @param event - Event name from the SDK
   * @param listener - Callback invoked with the event payload
   * @returns cleanup function to remove this listener
   */
  onQAEventFromQAA<K extends keyof QAAToSDKEvents >(
    event: K,
    listener: (data: QAAToSDKEvents[K]) => void
  ): () => void {
    this.on(event, listener);

    // Return cleanup function
    return () => this.off(event, listener);
  }

  /**
   * Remove a specific typed listener for a QA event.
   *
   * @template K - Key of QAEventMap
   * @param event - Event name
   * @param listener - Previously registered listener to remove
   */
  offQAEvent<K extends keyof QAEventMap>(
    event: K,
    listener: (data: QAEventMap[K]) => void
  ): void {
    this.off(event, listener);
  }

  /**
   * Remove all listeners for a given QA event.
   *
   * @template K - Key of QAEventMap
   * @param event - Event name to clear listeners for
   */
  removeAllListenersForEvent<K extends keyof QAEventMap>(event: K): void {
    this.removeAllListeners(event);
  }

  /**
   * Quick check to determine if QA Assistant is currently active/listening.
   *
   * @returns true if there are active listeners for QA events, false otherwise
   */
  isQAActive(): boolean {
    return this.listenerCount(QAEventSdkName.SDK_ALLOCATED_VARIATIONS) > 0;
  }
}

export const ABTastyQAEventBus = QAEventBus.getInstance();

export type ABTastyQAEventBusType = typeof ABTastyQAEventBus;


