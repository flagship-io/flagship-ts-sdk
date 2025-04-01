import { IFlagshipConfig } from '../config/IFlagshipConfig';
import { FlagDTO } from '../types';
import { isBrowser } from '../utils/utils';

export function forceVariation({ flagDTO, config }:{flagDTO?:FlagDTO, config:IFlagshipConfig}):FlagDTO|undefined {
  if (__fsWebpackIsBrowser__) {
    if (!config.isQAModeEnabled || !isBrowser() || !flagDTO || !window?.flagship?.forcedVariations) {
      return undefined;
    }

    const forcedVariation = window.flagship.forcedVariations[flagDTO.campaignId];
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
