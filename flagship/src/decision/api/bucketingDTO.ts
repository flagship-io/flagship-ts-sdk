import { VariationGroupDTO } from '../../types';

export interface BucketingDTO {
    panic?:boolean
    campaigns?: Array<{
        id: string
        name?: string
        type: string
        slug?:string|null
        variationGroups:Array<VariationGroupDTO>
    }>
    accountSettings?:{
        enabledXPC?: boolean
        troubleshooting?:{
            startDate: string
            endDate: string
            traffic: number
            timezone: string,
           }
    }
}
