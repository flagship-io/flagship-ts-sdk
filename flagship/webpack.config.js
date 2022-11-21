'use strict'
const nodeConfig = require('./webpack/webpack.node.js')
const browserConfig = require('./webpack/webpack.browser.js')
const lite = require('./webpack/webpack.lite.js')

module.exports = [nodeConfig, browserConfig, lite]
