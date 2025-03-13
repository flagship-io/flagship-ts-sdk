// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeExternals = require('webpack-node-externals')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./common.cjs')

module.exports = merge(common(), {
  output: {
    filename: 'index.browser.lite.js',
    chunkFilename: 'chunks/browser/lite/[name].[contenthash].js',
    library: {
      type: 'umd'
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        use: [{
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        }]
      }
    ]
  },
  externals: [
    nodeExternals({
      importType: 'umd',
      allowlist: [
        'events'
      ]
    })
  ]
})
