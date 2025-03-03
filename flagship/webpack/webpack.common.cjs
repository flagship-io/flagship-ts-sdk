// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

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
    minimize: process.env.NODE_ENV === 'production',
    usedExports: true
  }
}

module.exports = () => {
  if (isProduction) {
    config.mode = 'production'
  } else {
    config.mode = 'development'
    config.plugins = [new BundleAnalyzerPlugin({
      analyzerMode: 'static'
    })]
  }

  return config
}
