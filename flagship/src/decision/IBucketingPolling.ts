import { FSSdkStatus } from '../enum/FSSdkStatus'
import { TroubleshootingData } from '../types'
import { WeakEventEmitter } from '../utils/WeakEventEmitter'
import { BucketingDTO } from './api/bucketingDTO'

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
