 
const path = require('path')
 
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

const isProduction = process.env.NODE_ENV === 'production'

const config = {
  entry: './src/index.ts',
  output: {
    path: path.resolve('./dist')
  },
  devtool: 'source-map',
  resolve: {
    plugins: [new TsconfigPathsPlugin()],
    extensions: ['.ts', '.tsx', '.js']
  },
  optimization: {
    minimize: false,
    usedExports: true,
    splitChunks: false,
    runtimeChunk: false,
    removeEmptyChunks: true,
    mangleExports: false
  }
}

module.exports = () => {
  if (isProduction) {
    config.mode = 'production'
  } else {
    config.mode = 'development'
  }

  return config
}
