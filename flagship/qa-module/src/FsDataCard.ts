import { LitElement, PropertyDeclaration, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { BucketingDTO, Campaign, ExposedVariation, Variation, VariationGroup } from './typings'
import './FsHeader'
import './FsCampaignItem'
@customElement('fs-data-card')
export class FsDataCard extends LitElement {
  static styles = css`
    .card {
      height: 100%;
    }

    .card-body {
      padding: 5px;
      height: calc(100% - 31px);
      overflow: auto;
      background: white;
    }
  `
  constructor () {
    super()
    this._campaigns = this.bucketing?.campaigns || []
  }

  @property({ type: Object })
    bucketing?: BucketingDTO

  @property({ type: Array })
    exposedVariations?: ExposedVariation[]

  @state()
  private _campaigns?: Campaign[]

  protected computeCampaigns () {
    const localCampaigns: Campaign[] = []
    const variations: Variation[] = []
    const variationGroups: VariationGroup[] = []
    const variationId: string[] = []
    const originalExposedVariations:Record<string, string> = {}

    this.exposedVariations?.forEach((item) => {
      const rootCampaigns = this.bucketing?.campaigns
      const campaign = rootCampaigns?.find((x) => x.id === item.campaignId)
      if (!campaign) {
        return
      }
      localCampaigns.push(campaign)
      variationGroups.push(...campaign.variationGroups)
      variationId.push(item.variationId)
      originalExposedVariations[item.originalVariationId] = item.originalVariationId
    })

    variationGroups.forEach((variationGroup) => {
      variations.push(...variationGroup.variations)
    })

    variations.forEach((variation) => {
      variation.isOriginal = false
      if (originalExposedVariations[variation.id]) {
        variation.isOriginal = true
      }

      if (variationId.includes(variation.id)) {
        variation.isSelected = true
        return
      }
      variation.isSelected = false
    })
    this._campaigns = localCampaigns
  }

  override requestUpdate (name?: PropertyKey | undefined, oldValue?: unknown, options?: PropertyDeclaration<unknown, unknown> | undefined): void {
    if (name === 'bucketing' || name === 'exposedVariations') {
      this.computeCampaigns()
    }
    super.requestUpdate(name, oldValue, options)
  }

  override render () {
    return html`
      <fs-header></fs-header>
      <div class="card-body">
        ${this._campaigns?.map(item => html`
          <fs-campaign-item .campaigns=${item} ></fs-campaign-item>
        `)}
      </div>
    `
  }
}
declare global {
  interface HTMLElementTagNameMap {
    'fs-data-card': FsDataCard;
  }
}
