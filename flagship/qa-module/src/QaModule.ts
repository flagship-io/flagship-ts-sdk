import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import './FsArrowDown'
import './FsDataCard'
import { BucketingDTO, ExposedVariation, Flagship, ForcedVariation, SelectedVariation } from './typings'

@customElement('fs-qa-module')
export class FsQaModule extends LitElement {
  static styles = css`
    :host {
      --primary-color: #48d4d4;
      --primary-color-1: #48d4d438;
      --primary-hover: #43c5c5;
      --primary-active: #49c9c9;
      --background: #f5f7fa;
    }

    .main {
      position: fixed;
      bottom: 10px;
      right: 10px;
      height: 32px;
      width: 32px;
      border: 1px solid var(--primary-color);
      border-radius: 5px;
      box-shadow: 0px 0px 2px var(--primary-color);
      box-sizing: border-box;
      overflow: hidden;
      background: var(--background);
      transition: all 1000ms;
      color: #004052;
    }
    .main-card {
      width: auto !important;
      left: 10px;
      height: 90% !important;
    }
    @media only screen and (min-width: 768px) {
      .main-card {
        width: 50% !important;
        left: unset;
      }
    }
    @media only screen and (min-width: 992px) {
      .main-card {
        width: 30% !important;
        left: unset;
      }
    }
  `
  constructor () {
    super()
    this.addEventListener('onFsClickCloseCard', this._toggleShowCard)
    this.addEventListener('onFsValidation', this._onFsValidation)
    this.forceVariations = []
  }

  @property({ type: Object })
    classes = { main: true, 'main-card': false }

  @property({ type: Object })
    flagship: Flagship

  @state()
  private _showCard = false

  @state()
  private _bucketing?: BucketingDTO

  @state()
  private _exposedVariations?: ExposedVariation[]

  protected forceVariations:ForcedVariation[]

  private _toggleShowCard () {
    this._bucketing = this.flagship.getBucketingContent()
    this._exposedVariations = this.flagship
      .getVisitor()
      ?.getExposedVariations()
    this._showCard = !this._showCard
    this.classes = { ...this.classes, 'main-card': this._showCard }
  }

  private _onFsValidation (e:Event) {
    this.dispatchEvent(new CustomEvent<{forcedVariations:ForcedVariation[]}>('onFsForcedVariations', {
      detail: {
        forcedVariations: this.forceVariations
      },
      bubbles: true,
      composed: true
    }))
    e.stopImmediatePropagation()
  }

  protected _onVariationSelected (e:CustomEvent<SelectedVariation>) {
    const forceVariation = this.forceVariations.find(
      (x) => x.campaignId === e.detail.campaignId
    )
    const item = e.detail
    if (forceVariation) {
      forceVariation.variationId = item.selectedVariation.id
      forceVariation.variationGroupId = item.variationGroupId
      return
    }
    this.forceVariations.push({
      variationId: item.selectedVariation.id,
      campaignId: item.campaignId,
      variationGroupId: item.variationGroupId
    })
    e.stopImmediatePropagation()
  }

  protected getComponent () {
    if (this._showCard) {
      return html`<fs-data-card
        .bucketing=${this._bucketing}
        .exposedVariations=${this._exposedVariations}
        @onVariationSelected=${this._onVariationSelected}
      ></fs-data-card>`
    }
    return html`<fs-arrow-down
      @onClick=${this._toggleShowCard}
    ></fs-arrow-down>`
  }

  override render () {
    return html`
      <div class=${classMap(this.classes)}>${this.getComponent()}</div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'fs-qa-module': FsQaModule;
  }
}
