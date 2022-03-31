// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeExternals = require('webpack-node-externals')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('../../../webpack/webpack.common')

const path = require("path")


module.exports = merge(common(), {
  target: 'web',
  resolve: {
    alias: {
      // "@flagship.io/enum": path.resolve("../enum/dist/index.browser.js") ,
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
      // modulesFromFile: true,
      modulesDir: path.resolve('../../node_modules'),
      importType: 'umd',
      allowlist: [
        /@flagship\.io\/enum/,
        /@babel\/runtime/,
        /regenerator-runtime/
      ]
    })
  ]
})
