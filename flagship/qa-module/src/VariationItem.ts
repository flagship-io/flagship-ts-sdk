import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { Variation } from './typings'

@customElement('variation-item')
export class VariationItem extends LitElement {
  static styles = css`
    :host {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      border-radius: 5px;
      padding: 5px;
      margin-bottom: 5px;
    }
  `
    @property({ type: Object })
      variation: Variation

    override render () {
      return html`
      <div>
        <div>
          <div>variation name ${this.variation.id}{" "}</div>
          <pre>${JSON.stringify(this.variation.modifications.value, null, 4)}</pre>
        </div>
        <label className="container">
          <input
            type="radio"
            .checked=${!!this.variation.isSelected}
            onChange="{onVariationSelected}"
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
