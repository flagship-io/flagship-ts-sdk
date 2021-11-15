import { HitType } from '../enum/index'

export type HitCache ={
    version: number,
    data: {
        visitorId: string,
        anonymousId: string|null,
        type: HitType
    }
}

export type HitCacheSaveDTO = HitCache & {
    data: {
        content: Record<string, unknown>
    }
}

export type HitCacheLookupDTO = HitCache & {
    data:{
        content?:Record<string, unknown>
    }
}
