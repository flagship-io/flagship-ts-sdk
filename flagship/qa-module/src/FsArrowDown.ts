import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('fs-arrow-down')
export class FsArrowDown extends LitElement {
  static arrowDownImage =
    'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMzIgMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTE2IDIxYTEgMSAwIDAgMS0uNzEtLjI5bC04LThhMSAxIDAgMSAxIDEuNDItMS40Mmw3LjI5IDcuMyA3LjI5LTcuM2ExIDEgMCAwIDEgMS40MiAxLjQybC04IDhBMSAxIDAgMCAxIDE2IDIxWiIgZGF0YS1uYW1lPSJMYXllciAyIiBmaWxsPSIjNDhkNGQ0IiBjbGFzcz0iZmlsbC0wMDAwMDAiPjwvcGF0aD48cGF0aCBkPSJNMCAwaDMydjMySDB6IiBmaWxsPSJub25lIj48L3BhdGg+PC9zdmc+'

  static styles = css`
    :host {
      transition: all 300ms;
    }
    :host:hover {
      background: #48d4d438;
    }
  `
  private _onArrowClick () {
    this.dispatchEvent(new CustomEvent('onClick', { bubbles: true, composed: false }))
  }

  override render () {
    return html`
     <div  @click=${this._onArrowClick}>
      <img  .src=${FsArrowDown.arrowDownImage} />
    </div>
    `
  }
}
declare global {
  interface HTMLElementTagNameMap {
    'fs-arrow-down': FsArrowDown;
  }
}
