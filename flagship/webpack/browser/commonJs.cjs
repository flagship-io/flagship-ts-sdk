 
const { merge } = require('webpack-merge')
 
const nodeExternals = require('webpack-node-externals')
 
const common = require('./common.cjs')
 
const webpack = require('webpack')

module.exports = merge(common(), {
  output: {
    library: {
      type: 'commonjs2'
    },
    filename: 'index.browser.commonjs.js'
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        use: [
          {
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
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      browsers: [
                        '>0.3%',
                        'last 2 versions',
                        'ie >= 11',
                        'safari >= 7',
                        'edge >= 12'
                      ],
                      safari: '7'
                    },
                    useBuiltIns: 'usage',
                    corejs: 3
                  }
                ],
                ['@babel/preset-typescript']
              ],
              plugins: [['@babel/plugin-transform-runtime']]
            }
          }
        ]
      }
    ]
  },
  externals: [
    nodeExternals({
      importType: 'commonjs',
      allowlist: [
        'events',
        /core-js\/modules/,
        /@babel\/runtime/
      ]
    })
  ],
  optimization: {
    splitChunks: false
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    })
  ]
})
