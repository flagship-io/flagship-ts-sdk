import './QaModule'

function FsQaModule () {
  const body = document.querySelector('body')
  let fsQaModule = body?.querySelector('fs-qa-module')
  if (!fsQaModule) {
    fsQaModule = document.createElement('fs-qa-module')
  }
  body?.append(fsQaModule)
  console.log('body', body)
}

export default FsQaModule
