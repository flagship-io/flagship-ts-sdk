// eslint-disable-next-line @typescript-eslint/no-var-requires
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeExternals = require('webpack-node-externals')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./webpack.common.cjs')

// eslint-disable-next-line @typescript-eslint/no-var-requires

module.exports = merge(common(), {
  entry: './src/jest/index.ts',
  target: 'node',
  output: {
    filename: 'jest/index.cjs',
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
        use: [
          {
            loader: 'babel-loader',
            options: {
              targets: { node: 14 },
              presets: [
                ['@babel/preset-env', {
                  targets: { node: 14 },
                  modules: false,
                  useBuiltIns: 'usage',
                  corejs: 3
                }],
                ['@babel/preset-typescript', { allowDeclareFields: true }]
              ],
              plugins: [
                ['@babel/plugin-transform-runtime']
              ]
            }
          }
        ]
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
