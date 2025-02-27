// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('../webpack.common.cjs')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack')

module.exports = () =>
  merge(common(), {
    target: 'web',
    resolve: {
      alias: {
        http: false,
        https: false,
        'node-fetch': false
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        webpackIsReactNative: JSON.stringify(false),
        webpackIsBrowser: JSON.stringify(false),
        webpackIsNode: JSON.stringify(false),
        webpackIsEdgeWorker: JSON.stringify(true)
      })
    ]
  })
