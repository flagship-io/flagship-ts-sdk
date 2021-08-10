export interface Targetings {
    operator: string;
    key: string;
    value: any;
}
export interface VariationGroupDTO {
    id: string;
    targeting: {
        targetingGroups: Array<{
            targetings: Array<Targetings>;
        }>;
    };
    variations: Array<{
        id: string;
        modifications: {
            type: string;
            value: any;
        };
        allocation?: number;
        reference?: boolean;
    }>;
}
export interface BucketingDTO {
    panic?: boolean;
    campaigns?: Array<{
        id: string;
        type: string;
        variationGroups: Array<VariationGroupDTO>;
    }>;
}
