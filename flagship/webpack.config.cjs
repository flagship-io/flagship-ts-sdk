/* eslint-disable @typescript-eslint/no-var-requires */
'use strict'
const nodeConfig = require('./webpack/webpack.cjs.cjs')
const nodeEsmConfig = require('./webpack/webpack.esm.cjs')
const browserConfig = require('./webpack/webpack.browser.cjs')
const browserLiteConfig = require('./webpack/webpack.browser.lite.cjs')

module.exports = [nodeConfig, nodeEsmConfig, browserConfig, browserLiteConfig]
