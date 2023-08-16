import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import './FsInputSearch'

const crossImg = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMzYgMzYiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMzYgMzYiPjxnIGlkPSJpY29ucyI+PHBhdGggZD0iTTYuMiAzLjUgMy41IDYuMmMtLjcuNy0uNyAxLjkgMCAyLjdsOS4yIDkuMi05LjIgOS4yYy0uNy43LS43IDEuOSAwIDIuN2wyLjYgMi42Yy43LjcgMS45LjcgMi43IDBsOS4yLTkuMiA5LjIgOS4yYy43LjcgMS45LjcgMi43IDBsMi42LTIuNmMuNy0uNy43LTEuOSAwLTIuN0wyMy4zIDE4bDkuMi05LjJjLjctLjcuNy0xLjkgMC0yLjdsLTIuNi0yLjZjLS43LS43LTEuOS0uNy0yLjcgMEwxOCAxMi43IDguOCAzLjVjLS43LS43LTEuOS0uNy0yLjYgMHoiIGlkPSJjbG9zZV8xXyIgZmlsbD0iI2ZmZmZmZiIgY2xhc3M9ImZpbGwtMjIyYTMwIj48L3BhdGg+PC9nPjwvc3ZnPg=='
const checkedImg = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMTczLjg5OCA0MzkuNDA0LTE2Ni40LTE2Ni40Yy05Ljk5Ny05Ljk5Ny05Ljk5Ny0yNi4yMDYgMC0zNi4yMDRsMzYuMjAzLTM2LjIwNGM5Ljk5Ny05Ljk5OCAyNi4yMDctOS45OTggMzYuMjA0IDBMMTkyIDMxMi42OSA0MzIuMDk1IDcyLjU5NmM5Ljk5Ny05Ljk5NyAyNi4yMDctOS45OTcgMzYuMjA0IDBsMzYuMjAzIDM2LjIwNGM5Ljk5NyA5Ljk5NyA5Ljk5NyAyNi4yMDYgMCAzNi4yMDRsLTI5NC40IDI5NC40MDFjLTkuOTk4IDkuOTk3LTI2LjIwNyA5Ljk5Ny0zNi4yMDQtLjAwMXoiIGZpbGw9IiNmZmZmZmYiIGNsYXNzPSJmaWxsLTAwMDAwMCI+PC9wYXRoPjwvc3ZnPg=='

@customElement('fs-header')
export class FsHeader extends LitElement {
  static styles = css`
    .card-header{
        background: var(--primary-color);
        color: white;
        padding: 5px;
    }
    
    .card-header-d-flex{
        display: flex;
        justify-content: space-between;
    }
    .btn-container{
    display: flex;
    justify-content: center;
    align-items: center;
}

.close-card, .validation-btn{
    cursor: pointer;
    padding: 1px 5px;
    border-radius: 5px;
    transition: all 300ms;
}

.close-card img {
    width: 15px;
}

.validation-btn img {
    width: 15px;
}

.close-card:hover, .validation-btn:hover{
    background: var(--primary-hover);
}
.close-card:active, .validation-btn:active{
    background: var(--primary-active);
}
    `

  protected _onClickCloseCard () {
    this.dispatchEvent(new CustomEvent('onFsClickCloseCard', { bubbles: true, composed: true }))
  }

  protected _onValidation () {
    this.dispatchEvent(new CustomEvent('onFsValidation', { bubbles: true, composed: true }))
  }

  override render () {
    return html`
        <div class="card-header card-header-d-flex">
            <div><span>Flagship </span> <fs-input-search></fs-input-search> </div>
            <div class="btn-container">
                <div class="validation-btn" onClick={onValidation} >
                <img .src=${checkedImg} alt="checked"  />
                </div>
                <div class="close-card" @click=${this._onClickCloseCard}>
                    <img .src=${crossImg} alt="cross"  />
                </div>
            </div>

        </div>
        `
  }
}
declare global {
  interface HTMLElementTagNameMap {
    'fs-header': FsHeader;
  }
}
