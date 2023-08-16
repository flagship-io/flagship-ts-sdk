import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import './FsHeader'
import { BucketingDTO, ExposedVariations } from './typings'

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
  @property({ type: Object })
    bucketing: BucketingDTO

  @property({ type: Array })
    exposedVariations: ExposedVariations[]

  override render () {
    return html`
      <fs-header></fs-header>
      <div class="card-body"></div>
    `
  }
}
declare global {
  interface HTMLElementTagNameMap {
    'fs-data-card': FsDataCard;
  }
}
