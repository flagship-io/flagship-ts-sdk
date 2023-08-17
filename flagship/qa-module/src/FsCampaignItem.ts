import { LitElement, PropertyDeclaration, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { Campaign, SelectedVariation, VariationGroup } from './typings'
import './VariationGroupItem'

@customElement('fs-campaign-item')
export class FsCampaignItem extends LitElement {
  static styles = css`
    .campaign {
      background: #eef0f3;
      padding: 5px 5px 1px 5px;
      border-radius: 5px;
      margin-bottom: 5px;
    }
    .main-hr {
      border-top: 1px solid #43c5c5;
    }
  `
  constructor () {
    super()
    this._variationGroups = []
  }

  @property({ type: Object })
    campaigns: Campaign

  @state()
  private _variationGroups: VariationGroup[]

  override requestUpdate (name?: PropertyKey | undefined, oldValue?: unknown, options?: PropertyDeclaration<unknown, unknown> | undefined): void {
    if (name === 'campaigns') {
      this._variationGroups = this.campaigns.variationGroups
    }
    super.requestUpdate(name, oldValue, options)
  }

  protected _onVariationSelected (e:CustomEvent<SelectedVariation>) {
    this._variationGroups = this._variationGroups.map(variationGroup => {
      return {
        ...variationGroup,
        variations: variationGroup.variations.map(variation => {
          variation.isSelected = false
          if (e.detail.selectedVariation.id === variation.id) {
            variation.isSelected = true
          }
          return { ...variation }
        })
      }
    })
  }

  protected override render () {
    return html`
      <div class="campaign">
        <div>Campaign name ${this.campaigns.id} ${this.campaigns.type}</div>
        <hr class="main-hr" />
        ${this._variationGroups.map(
          (item) =>
            html`<fs-variation-group
               @onVariationSelected=${this._onVariationSelected}
              .variationGroup=${item}
              .campaignId=${this.campaigns.id}
            ></fs-variation-group> `
        )}
      </div>
    `
  }
}
declare global {
    interface HTMLElementTagNameMap {
      'fs-campaign-item': FsCampaignItem;
    }
  }
