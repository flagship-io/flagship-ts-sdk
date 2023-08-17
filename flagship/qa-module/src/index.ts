import './QaModule'
import { Flagship, ForcedVariation } from './typings'

export const FsJsQaModule = {
  init (args:{ flagship: Flagship }) {
    const { flagship } = args
    const body = document.querySelector('body')
    let fsQaModule = body?.querySelector('fs-qa-module')
    if (!fsQaModule) {
      fsQaModule = document.createElement('fs-qa-module')
    }
    fsQaModule.flagship = flagship
    fsQaModule.addEventListener('onFsForcedVariations', (e:CustomEvent<{forcedVariations:ForcedVariation[]}>) => {
      sessionStorage.setItem('fsForcedVariation', JSON.stringify(e.detail.forcedVariations))
      document.location.reload()
    })
    body?.append(fsQaModule)
    console.log('body', body)
  },
  getForcedVariations ():ForcedVariation[]|null {
    const forcedVariations = sessionStorage.getItem('fsForcedVariation')
    if (forcedVariations) {
      return JSON.parse(forcedVariations)
    }
    return null
  }
}
