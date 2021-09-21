// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeExternals = require('webpack-node-externals')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./webpack.common.js')

module.exports = merge(common(), {
  target: 'node',
  output: {
    filename: 'index.node.js',
    library: {
      type: 'commonjs2'
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      AbortController: 'abort-controller'
    })
  ],
  externals: [
    nodeExternals({
      allowlist: ['node-fetch', 'abort-controller', 'follow-redirects']
    })
  ]
})
