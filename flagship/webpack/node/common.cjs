
const { merge } = require('webpack-merge')

const common = require('../webpack.common.cjs')

const webpack = require('webpack')

module.exports = () =>
  merge(common(), {
    target: 'node',
    resolve: {
      alias: {
        '../depsNode.native': '../depsNode',
        '../emotionAI/EmotionAI': '../emotionAI/EmotionAI.node'
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        __fsWebpackIsReactNative__: JSON.stringify(false),
        __fsWebpackIsBrowser__: JSON.stringify(false),
        __fsWebpackIsNode__: JSON.stringify(true),
        __fsWebpackIsEdgeWorker__: JSON.stringify(false),
        __fsWebpackIsDeno__: JSON.stringify(false)
      }),
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1
      })
    ]
  })
