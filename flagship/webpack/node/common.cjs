// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('../webpack.common.cjs')
// eslint-disable-next-line @typescript-eslint/no-var-requires
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
        webpackIsReactNative: JSON.stringify(false),
        webpackIsBrowser: JSON.stringify(false),
        webpackIsNode: JSON.stringify(true),
        webpackIsEdgeWorker: JSON.stringify(false)
      })
    ]
  })
