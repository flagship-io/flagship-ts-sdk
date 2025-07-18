 
 
const { merge } = require('webpack-merge')
 
const nodeExternals = require('webpack-node-externals')
 
const common = require('./common.cjs')

 

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
      type: 'commonjs',
      allowlist: [
        /core-js\/modules\/es/,
        /core-js\/modules\/web/,
        /@babel\/runtime/,
        'node-abort-controller',
        // 'events'
      ]
    })
  ]
})
