 
const { merge } = require('webpack-merge')
 
const nodeExternals = require('webpack-node-externals')
 
const common = require('./common.cjs')

 

module.exports = merge(common(), {
  output: {
    filename: 'index.react-native.commonjs.js',
    library: {
      type: 'commonjs2'
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@react-native/babel-preset']
          }
        }
      }
    ]
  },
  externals: [
    nodeExternals()
  ]
})
