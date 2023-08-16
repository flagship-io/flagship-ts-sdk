import { LitElement, html } from 'lit'
import { property, customElement } from 'lit/decorators'
import { VariationGroup } from './typings'
import './VariationItem'

@customElement('fs-variation-group')
export class VariationGroupItem extends LitElement {
    @property({ type: Object })
      variationGroup: VariationGroup

    override render () {
      return html`
        ${this.variationGroup.variations.map(item => html`
            <variation-item .variation=${item} ></variation-item>
        `)}
    `
    }
}
declare global {
    interface HTMLElementTagNameMap {
      'fs-variation-group': VariationGroupItem;
    }
  }
