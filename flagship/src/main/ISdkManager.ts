import { EAIConfig } from '../type.local'
import { BucketingDTO } from '../types'

export interface ISdkManager {
    getBucketingContent(): BucketingDTO | undefined
    initSdk(): Promise<void>
    getEAIConfig(): EAIConfig|undefined
    resetSdk(): void
}
