// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeExternals = require('webpack-node-externals')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./webpack.common.cjs')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TerserPlugin = require('terser-webpack-plugin')

module.exports = merge(common(), {
  target: 'node',
  resolve: {
    alias: {}
  },
  output: {
    filename: 'index.cjs',
    library: {
      type: 'commonjs2'
    }
  },
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    usedExports: true
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            targets: { node: 6 },
            assumptions: {
              noDocumentAll: true,
              noClassCalls: true,
              constantSuper: true,
              enumerableModuleMeta: true,
              noNewArrows: true
            },
            presets: [
              ['@babel/preset-env', {
                targets: { node: 6 },
                modules: false,
                useBuiltIns: 'usage',
                corejs: 3
              }],
              ['@babel/preset-typescript']
            ],
            plugins: [
              ['@babel/plugin-transform-runtime']
            ]
          }
        }]
      }
    ]
  },
  externals: [
    nodeExternals({
      allowlist: [
        /core-js\/modules\/es/,
        /@babel\/runtime/
      ]
    })
  ]
})
