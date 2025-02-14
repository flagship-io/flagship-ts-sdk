// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeExternals = require('webpack-node-externals')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./webpack.common.cjs')

module.exports = merge(common(), {
  target: 'web',
  experiments: {
    outputModule: true
  },
  resolve: {
    alias: {
      http: false,
      https: false,
      'node-fetch': false
    }
  },
  output: {
    filename: 'index.browser.esm.js',
    library: {
      type: 'module'
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
