 
'use strict'
const browserGlobalConfig = require('./webpack/browser/global.cjs')
const browserUmdConfig = require('./webpack/browser/umd.cjs')
const browserLiteConfig = require('./webpack/browser/lite.cjs')
const edgeCommonJsConfig = require('./webpack/edge/commonJs.cjs')
const edgeEsmConfig = require('./webpack/edge/esm.cjs')
const nodeCommonJsConfig = require('./webpack/node/commonJs.cjs')
const nodeEsmConfig = require('./webpack/node/esm.cjs')
const reactNativeCommonJsConfig = require('./webpack/react-native/commonJs.cjs')
const reactNativeEsmConfig = require('./webpack/react-native/esm.cjs')
const browserCommonJsConfig = require('./webpack/browser/commonJs.cjs')

module.exports = [
  browserGlobalConfig,
  browserUmdConfig,
  browserLiteConfig,
  browserCommonJsConfig,
  edgeCommonJsConfig,
  edgeEsmConfig,
  nodeCommonJsConfig,
  nodeEsmConfig,
  reactNativeCommonJsConfig,
  reactNativeEsmConfig
]
