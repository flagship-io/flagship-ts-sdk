 
const { merge } = require('webpack-merge')
 
const common = require('../webpack.common.cjs')
 
const webpack = require('webpack')

module.exports = () =>
  merge(common(), {
    target: 'node',
    resolve: {
      alias: {
        '../emotionAI/EmotionAI': '../emotionAI/EmotionAI.node.native',
        '../visitor/VisitorProfileCache.node':
          '../visitor/VisitorProfileCache.react-native',
        '../emotionAI/EmotionAI.node': '../emotionAI/EmotionAI.react-native'
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        __fsWebpackIsReactNative__: JSON.stringify(true),
        __fsWebpackIsBrowser__: JSON.stringify(false),
        __fsWebpackIsNode__: JSON.stringify(false),
        __fsWebpackIsEdgeWorker__: JSON.stringify(false),
        __fsWebpackIsDeno__: JSON.stringify(false)
      }),
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1
      })
    ]
  })
