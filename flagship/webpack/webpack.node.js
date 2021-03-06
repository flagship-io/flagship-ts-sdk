// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeExternals = require('webpack-node-externals')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./webpack.common.js')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TerserPlugin = require('terser-webpack-plugin')

module.exports = merge(common(), {
  target: 'node',
  output: {
    filename: 'index.node.js',
    library: {
      type: 'commonjs2'
    }
  },
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: /AbortSignal/,
          keep_fnames: /AbortSignal/
        }
      })
    ]
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            targets: 'node >= 6',
            assumptions: {
              noDocumentAll: true,
              noClassCalls: true,
              constantSuper: true,
              enumerableModuleMeta: true,
              noNewArrows: true
            },
            presets: [
              ['@babel/preset-env',
                {
                  useBuiltIns: 'usage',
                  corejs: 3
                }
              ],
              ['@babel/preset-typescript', { allowNamespaces: true }]
            ],
            plugins: [
              [
                '@babel/plugin-transform-runtime'
              ]
            ]
          }
        }]
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      AbortController: 'abort-controller'
    })
  ],
  externals: [
    nodeExternals()
  ]
})
