
export interface bucketingDTO {
    campaigns: Array<{
        id: string
        type: string
        variationGroups:Array<{
            id:string,
            targeting:{
                targetingGroups:Array<{
                    targetings:Array<{
                        operator:string,
                        key: string,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        value: any
                    }>
                }>
            },
            variations:Array<{
                id: string
                modifications: {
                    type: string
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value:any
                }
                allocation: number
                reference?: boolean
            }>
        }>
    }>
}
