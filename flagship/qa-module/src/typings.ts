export type Targetings = {
  operator: string;
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
};

export type Variation = {
  id: string;
  modifications: {
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
  };
  allocation?: number;
  reference?: boolean;
  isSelected?: boolean;
  isOriginal?: boolean;
};
export type VariationGroup = {
  id: string;
  targeting: {
    targetingGroups: Array<{
      targetings: Array<Targetings>;
    }>;
  };
  variations: Variation[];
  campaignId?: string;
};

export type Campaign = {
  id: string;
  type: string;
  slug?: string | null;
  variationGroups: VariationGroup[];
};
export type BucketingDTO = {
  panic?: boolean;
  campaigns?: Campaign[];
};

export type ForcedVariation = {
  campaignId: string;
  variationGroupId: string;
  variationId: string;
};
export type ExposedVariation = {
  campaignId: string;
  variationGroupId: string;
  variationId: string;
  originalVariationId: string;
};

export type Visitor = {
  addForcedVariation(value: ForcedVariation): Visitor;
  removeForcedVariation(variationId: string): Visitor;

  getExposedVariations(): ExposedVariation[];
};

export type Flagship = {
  getBucketingContent(): BucketingDTO | undefined;
  getVisitor(): Visitor | undefined;
};

export type SelectedVariation = {
  selectedVariation: Variation;
  campaignId: string;
  variationGroupId: string;
};
