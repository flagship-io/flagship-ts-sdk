import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { SelectedVariation, Variation } from './typings'
import { classMap } from 'lit/directives/class-map.js'

@customElement('variation-item')
export class VariationItem extends LitElement {
  static styles = css`
    .variationItem {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      border-radius: 5px;
      padding: 5px;
      margin-bottom: 5px;
    }
    .original-variationItem {
      background: #cff1e9 !important;
    }
  `
  @property({ type: Object })
    variation: Variation

  @property({ type: String })
    campaignId: string

  @property({ type: String })
    variationGroupId: string

  protected _onVariationSelected () {
    this.dispatchEvent(
      new CustomEvent<SelectedVariation>('onVariationSelected', {
        detail: {
          selectedVariation: this.variation,
          campaignId: this.campaignId,
          variationGroupId: this.variationGroupId
        },
        bubbles: true,
        composed: true
      })
    )
  }

  override render () {
    return html`
      <div
        class=${classMap({
          variationItem: true,
          'original-variationItem': !!this.variation.isOriginal
        })}
      >
        <div>
          <div>variation name ${this.variation.id}</div>
          <pre>${JSON.stringify(this.variation.modifications.value, null, 4)}</pre>
        </div>
        <label className="container">
          <input
            type="radio"
            .checked=${!!this.variation.isSelected}
            @change=${this._onVariationSelected}
          />
          <span className="checkmark"></span>
        </label>
      </div>
    `
  }
}
declare global {
  interface HTMLElementTagNameMap {
    'variation-item': VariationItem;
  }
}
