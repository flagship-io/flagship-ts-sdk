import { copyFileSync } from 'fs'

const distDir = './dist'
const indexDTsFile = 'index.d.ts'
copyFileSync(distDir + '/' + indexDTsFile, distDir + '/index.browser.lite.d.ts')
copyFileSync(distDir + '/' + indexDTsFile, distDir + '/index.browser.d.ts')
copyFileSync(distDir + '/' + indexDTsFile, distDir + '/index.node.d.ts')
