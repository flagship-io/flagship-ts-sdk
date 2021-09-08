const { merge } = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const common = require('./webpack.common.js')

module.exports = merge(common(), {
  target: 'node',
  output: {
    filename: 'index.node.js',
    library: {
      type: 'commonjs2'
    }
  },
  externals: [
    nodeExternals({
      allowlist: ['axios', 'events', 'http', 'https']
    })
  ]
})
