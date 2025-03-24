// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeExternals = require('webpack-node-externals')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./common.cjs')

// eslint-disable-next-line @typescript-eslint/no-var-requires

module.exports = merge(common(), {
  experiments: {
    outputModule: true
  },
  output: {
    filename: 'index.react-native.esm.js',
    library: {
      type: 'module'
    },
    chunkFormat: 'module'
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
      importType: 'module'
    })
  ]
})
