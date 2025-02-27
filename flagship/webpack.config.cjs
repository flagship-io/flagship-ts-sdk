/* eslint-disable @typescript-eslint/no-var-requires */
'use strict'
// const nodeConfig = require('./webpack/webpack.cjs.cjs')
// const browserConfig = require('./webpack/webpack.browser.cjs')
// const browserLiteConfig = require('./webpack/webpack.browser.lite.cjs')
// const browserEsmConfig = require('./webpack/webpack.browser.esm.cjs')

const browserGlobalConfig = require('./webpack/browser/global.cjs')
const browserUmdConfig = require('./webpack/browser/umd.cjs')
const browserEsmConfig = require('./webpack/browser/esm.cjs')
const browserLiteConfig = require('./webpack/browser/lite.cjs')
const edgeCommonJsConfig = require('./webpack/edge/commonJs.cjs')
const edgeEsmConfig = require('./webpack/edge/esm.cjs')
const nodeCommonJsConfig = require('./webpack/node/commonJs.cjs')
const nodeEsmConfig = require('./webpack/node/esm.cjs')
const reactNativeCommonJsConfig = require('./webpack/react-native/commonJs.cjs')
const reactNativeEsmConfig = require('./webpack/react-native/esm.cjs')

module.exports = [
  browserGlobalConfig,
  browserUmdConfig,
  browserEsmConfig,
  browserLiteConfig,
  edgeCommonJsConfig,
  edgeEsmConfig,
  nodeCommonJsConfig,
  nodeEsmConfig,
  reactNativeCommonJsConfig,
  reactNativeEsmConfig
]
