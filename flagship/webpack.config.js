'use strict'
const nodeConfig = require('./webpack/webpack.node.js')
const browserConfig = require('./webpack/webpack.browser.js')
const jamstack = require('./webpack/webpack.jamstack')

module.exports = [nodeConfig, browserConfig, jamstack]
