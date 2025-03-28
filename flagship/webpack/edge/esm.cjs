 
const { merge } = require('webpack-merge')
 
const nodeExternals = require('webpack-node-externals')
 
const common = require('./common.cjs')

module.exports = merge(common(), {
  experiments: {
    outputModule: true
  },
  output: {
    filename: 'index.edge.esm.js',
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
      importType: 'module',
      allowlist: [
        'events'
      ]
    })
  ]
})
