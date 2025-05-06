import { IFlagshipConfig } from '../config/IFlagshipConfig.ts';
import { VisitorVariationState } from '../type.local.ts';
import { FlagDTO } from '../types.ts';
import { isBrowser } from '../utils/utils.ts';

export function forceVariation({ flagDTO, config, visitorVariationState }:{
  flagDTO?:FlagDTO,
  config:IFlagshipConfig,
  visitorVariationState: VisitorVariationState
}):FlagDTO|undefined {
  if (__fsWebpackIsBrowser__) {

    if (!config.isQAModeEnabled || !isBrowser() || !flagDTO || !visitorVariationState.forcedVariations) {
      return undefined;
    }

    const forcedVariation = visitorVariationState.forcedVariations[flagDTO.campaignId];
    if (!forcedVariation) {
      return undefined;
    }

    const { campaignId, campaignName, variationGroupId, variationGroupName, campaignType, CampaignSlug, variation } = forcedVariation;
    const value = variation.modifications.value[flagDTO.key];

    return {
      key: flagDTO.key,
      campaignId,
      campaignName,
      variationGroupId,
      variationGroupName: variationGroupName as string,
      variationId: variation.id,
      variationName: variation.name as string,
      isReference: !!variation.reference,
      campaignType,
      slug: CampaignSlug,
      value
    };
  }

  return undefined;
}
