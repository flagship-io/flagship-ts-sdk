// Generated using webpack-cli https://github.com/webpack/webpack-cli

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-var-requires
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
