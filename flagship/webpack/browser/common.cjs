 
const { merge } = require('webpack-merge')
 
const common = require('../webpack.common.cjs')
 
const webpack = require('webpack')

module.exports = () =>
  merge(common(), {
    target: 'web',
    resolve: {
      alias: {
        http: false,
        https: false,
        'node-fetch': false,
        '../visitor/VisitorProfileCache.node': '../visitor/VisitorProfileCache.browser',
        '../emotionAI/EmotionAI.node': '../emotionAI/EmotionAI.browser'
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        __fsWebpackIsReactNative__: JSON.stringify(false),
        __fsWebpackIsBrowser__: JSON.stringify(true),
        __fsWebpackIsNode__: JSON.stringify(false),
        __fsWebpackIsEdgeWorker__: JSON.stringify(false),
        __fsWebpackIsDeno__: JSON.stringify(false)
      })
    ],
    optimization: {
      splitChunks: {
        chunks: 'async',
        minChunks: 1,
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          }
        }
      }
    }
  })
