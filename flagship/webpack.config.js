/* eslint-disable @typescript-eslint/no-var-requires */
'use strict'
const nodeConfig = require('./webpack/webpack.node.js')
const browserConfig = require('./webpack/webpack.browser.js')
const browserLiteConfig = require('./webpack/webpack.browser.lite.js')

module.exports = [nodeConfig, browserConfig, browserLiteConfig]
