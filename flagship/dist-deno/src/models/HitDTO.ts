import { IHit, Modification } from '...ts'
import { HitType } from '../enum/index.ts'

export type HitCache ={
    version: number,
    data: {
        visitorId: string,
        anonymousId: string|null,
        type: HitType|'BATCH'|'ACTIVATE',
        time: number
    }
}

export type HitCacheSaveDTO = HitCache & {
    data: {
        content: Record<string, unknown>
    }
}

export type HitCacheLookupDTO = HitCache & {
    data:{
        content?:IHit|Modification
    }
}
