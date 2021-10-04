// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeExternals = require('webpack-node-externals')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./webpack.common.js')

module.exports = merge(common(), {
  target: 'web',
  resolve: {
    alias: {
      http: false,
      https: false,
      'node-fetch': false
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
      importType: 'umd',
      allowlist: [
        'events',
        /@babel\/runtime/,
        /regenerator-runtime/
      ]
    })
  ]
})
