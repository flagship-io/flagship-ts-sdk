
export interface Targetings{
    operator:string,
    key: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
}
export interface VariationGroupDTO {
    id:string,
    targeting:{
        targetingGroups:Array<{
            targetings:Array<Targetings>
        }>
    },
    variations:Array<{
        id: string
        modifications: {
            type: string
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            value:any
        }
        allocation?: number
        reference?: boolean
    }>
}

export interface BucketingDTO {
    panic?:boolean
    campaigns?: Array<{
        id: string
        type: string
        slug?:string|null
        variationGroups:Array<VariationGroupDTO>
    }>
    accountSettings:{
        enabledXPC: true
        troubleshooting?:{
            startDate: string
            endDate: string
            traffic: number
            timezone: string,
           }
    }
}
