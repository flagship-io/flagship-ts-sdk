import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('fs-input-search')
export class FsInputSearch extends LitElement {
  static styles = css`
    .input-search {
      border: unset;
      border-radius: 5px;
      color: #004052;
      padding: 2px;
    }

    .input-search:focus {
      outline: 1px solid var(--background);
    }
  `
  override render () {
    return html`<input
      class="input-search"
      type="search"
      placeholder="search"
      value="{search}"
    />`
  }
}

declare global {
    interface HTMLElementTagNameMap {
      'fs-input-search': FsInputSearch;
    }
  }
