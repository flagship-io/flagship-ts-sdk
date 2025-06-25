 
const { merge } = require('webpack-merge')
 
const common = require('../webpack.common.cjs')
 
const webpack = require('webpack')

module.exports = () =>
  merge(common(), {
    target: 'webworker',
    resolve: {
      alias: {
        http: false,
        https: false,
        'node-fetch': false,
        './LocalAbortController': './LocalAbortController.node',
        'node-abort-controller': 'node-abort-controller/index.js',
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        __fsWebpackIsReactNative__: JSON.stringify(false),
        __fsWebpackIsBrowser__: JSON.stringify(false),
        __fsWebpackIsNode__: JSON.stringify(false),
        __fsWebpackIsEdgeWorker__: JSON.stringify(true),
        __fsWebpackIsDeno__: JSON.stringify(false)
      }),
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1
      })
    ]
  })
