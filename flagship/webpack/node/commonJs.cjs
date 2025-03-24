// eslint-disable-next-line @typescript-eslint/no-var-requires
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeExternals = require('webpack-node-externals')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require('./common.cjs')

// eslint-disable-next-line @typescript-eslint/no-var-requires

module.exports = merge(common(), {
  output: {
    filename: 'index.node.commonjs.cjs',
    library: {
      type: 'commonjs2'
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
                modules: 'commonjs',
                useBuiltIns: 'usage',
                corejs: 3
              }],
              ['@babel/preset-typescript']
            ],
            plugins: [
              ['@babel/plugin-transform-runtime', {
                regenerator: true,
                helpers: true,
                useESModules: false
              }]
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
        /core-js\/modules\/web/,
        /@babel\/runtime/
      ]
    })
  ]
})
