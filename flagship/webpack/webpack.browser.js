const { merge } = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const common = require('./webpack.common.js')

module.exports = merge(common(), {
  target: 'web',
  resolve: {
    alias: {
      https: 'https-browserify',
      http: 'http-browserify'
    }
  },
  output: {
    filename: 'index.browser.js',
    library: {
      type: 'umd'
    }
  },
  externals: [
    nodeExternals({
      allowlist: ['axios', 'events']
    })
  ]
})
