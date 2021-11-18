import { primitive } from '...ts'

export type VisitorSaveCacheDTO = {
    version: number,
    data: {
      visitorId: string,
      anonymousId: string|null,
      consent: boolean,
      context: Record<string, primitive>,
      campaigns: Array<{
        campaignId: string,
        variationGroupId: string,
        variationId: string,
        isReference:boolean,
        type: string,
        activated: boolean,
        flags: Record<string, unknown>
      }>
  }
}

export type VisitorLookupCacheDTO = {
    version: number,
    data: {
      visitorId: string,
      anonymousId: string|null,
      consent?: boolean,
      context?: Record<string, primitive>,
      campaigns?: Array<{
          campaignId: string,
          variationGroupId: string,
          variationId: string,
          isReference:boolean
          type: string,
          activated?: boolean,
          flags?: Record<string, unknown>
        }>
  }
}
