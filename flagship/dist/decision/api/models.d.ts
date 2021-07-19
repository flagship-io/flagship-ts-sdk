export declare class CampaignDTO {
    id: string;
    variationGroupId: string;
    variation: VariationDTO;
}
export declare class VariationDTO {
    id: string;
    reference: boolean;
    modifications: ModificationsDTO;
}
export declare class ModificationsDTO {
    type: string;
    value: any;
}
