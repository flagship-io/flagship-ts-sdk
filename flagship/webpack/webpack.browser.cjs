// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeExternals = require('webpack-node-externals')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./webpack.common.cjs')

module.exports = merge(common(), {
  target: 'web',
  resolve: {
    alias: {
      http: false,
      https: false,
      'node-fetch': false
    }
  },
  output: {
    library: {
      type: 'global'
    },
    filename: '[name].browser.js',
    chunkFilename: '[name].browser.[id].[contenthash].js'
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
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
                  targets: '>0.3%, last 2 versions, not dead',
                  useBuiltIns: 'usage',
                  corejs: 3
                }
              ],
              ['@babel/preset-typescript']
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
  externals: [
    nodeExternals({
      importType: 'umd',
      allowlist: [
        'node-abort-controller',
        'events',
        /core-js\/modules/,
        /@babel\/runtime/
      ]
    })
  ],
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
})
