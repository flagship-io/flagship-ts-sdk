// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('../webpack.common.cjs')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeExternals = require('webpack-node-externals')

module.exports = () =>
  merge(common(), {
    target: 'node',
    resolve: {
      alias: {
        '../emotionAI/EmotionAI': '../emotionAI/EmotionAI.node.native'
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        __fsWebpackIsReactNative__: JSON.stringify(true),
        __fsWebpackIsBrowser__: JSON.stringify(false),
        __fsWebpackIsNode__: JSON.stringify(false),
        __fsWebpackIsEdgeWorker__: JSON.stringify(false),
        __fsWebpackIsDeno__: JSON.stringify(false)
      })
    ],
    externals: [
      nodeExternals()
    ]
  })
