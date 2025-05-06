import { EAIConfig } from '../type.local.ts';
import { BucketingDTO } from '../types.ts';

export interface ISdkManager {
    getBucketingContent(): BucketingDTO | undefined
    initSdk(): Promise<void>
    getEAIConfig(): EAIConfig|undefined
    resetSdk(): void
}
