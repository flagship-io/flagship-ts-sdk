/* eslint-disable @typescript-eslint/no-var-requires */
'use strict'
const nodeConfig = require('./webpack/webpack.node.cjs')
const browserConfig = require('./webpack/webpack.browser.cjs')
const browserLiteConfig = require('./webpack/webpack.browser.lite.cjs')

module.exports = [nodeConfig, browserConfig, browserLiteConfig]
