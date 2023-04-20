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
      'node-fetch': false,
      '../depsNodeEsm': '../depsBrowser.ts'
    }
  },
  output: {
    filename: 'index.browser.js',
    library: {
      type: 'umd'
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            targets: '> 0.5%, last 2 versions, ie >= 10',
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
  externals: [
    nodeExternals({
      importType: 'umd',
      allowlist: [
        'events',
        /@babel\/runtime/,
        /regenerator-runtime/
      ]
    })
  ]
})
