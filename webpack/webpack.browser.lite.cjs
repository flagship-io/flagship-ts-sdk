// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeExternals = require('webpack-node-externals')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./webpack.common.cjs')

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
    filename: 'index.browser.lite.js',
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
