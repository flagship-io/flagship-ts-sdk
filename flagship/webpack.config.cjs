/* eslint-disable @typescript-eslint/no-var-requires */
'use strict'
const nodeConfig = require('./webpack/webpack.cjs.cjs')
const browserConfig = require('./webpack/webpack.browser.cjs')
const browserLiteConfig = require('./webpack/webpack.browser.lite.cjs')
const browserEsmConfig = require('./webpack/webpack.browser.esm.cjs')

module.exports = [nodeConfig, browserConfig, browserLiteConfig, browserEsmConfig]
