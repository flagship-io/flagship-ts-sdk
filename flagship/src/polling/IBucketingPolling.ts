import { WeakEventEmitter } from '../utils/WeakEventEmitter'
import { FSSdkStatus } from '../enum/FSSdkStatus'
import { BucketingDTO, TroubleshootingData } from '../types'

/**
 * Represents the interface for the Bucketing Polling module.
 * This module is responsible for polling the Flagship API to get the bucketing data.
 * It also handles the panic mode and the troubleshooting data.
 * @extends WeakEventEmitter
 */
export interface IBucketingPolling extends WeakEventEmitter {
    /**
     * Starts the polling process.
     */
    startPolling (): Promise<void>
    /**
     * Stops the polling process.
     */
    stopPolling (): void

    /**
     * Returns the bucketing status.
     */
    getBucketingStatus (): number|undefined
    /**
     * Returns the last polling timestamp with code 200.
     */
    getLastPollingTimestamp(): string|undefined
    /**
     * Returns the troubleshooting data.
     */
    getTroubleshootingData(): TroubleshootingData|undefined

    /**
     * A callback function to be called when the SDK status has changed.
     */
    onStatusChanged(func:(status: FSSdkStatus)=>void):void
    /**
     * Returns whether the SDK is in panic mode.
     */
    isPanicMode(): boolean

    /**
     * Returns the bucketing content.
     */
    getBucketingContent(): BucketingDTO | undefined
}
