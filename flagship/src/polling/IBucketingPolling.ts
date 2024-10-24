import { WeakEventEmitter } from '../utils/WeakEventEmitter'
import { FSSdkStatus } from '../enum/FSSdkStatus'
import { BucketingDTO, TroubleshootingData } from '../types'

export interface IBucketingPolling extends WeakEventEmitter {
    startPolling (): Promise<void>
    stopPolling (): void
    bucketingStatus (): number|undefined
    getLastPollingTimestamp(): string|undefined
    getTroubleshootingData(): TroubleshootingData|undefined
    onStatusChanged(func:(status: FSSdkStatus)=>void):void
    isPanicMode(): boolean
    getBucketingContent(): BucketingDTO | undefined
}
