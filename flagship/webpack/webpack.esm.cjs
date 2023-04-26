// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeExternals = require('webpack-node-externals')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./webpack.common.cjs')

module.exports = merge(common(), {
  target: 'node12.22',
  resolve: {
    alias: {}
  },
  experiments: {
    outputModule: true
  },
  output: {
    filename: 'index.node.js',
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
          options: {}
        }]
      }
    ]
  },
  externals: [
    nodeExternals()
  ]
})
