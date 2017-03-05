const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: {
    demo: './src/index.js'
  },
  devtool: 'source-map',
  output: {
    path: './dist',
    filename: "[name]-bundle.js",
    libraryTarget: 'umd',
  },
  module: {
    loaders: [ {test: /\.js$/,
      exclude: /(node_modules)/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015']
      }}
    ]
  },
  resolve: {
    alias: {
      'remoteDOM': path.resolve(__dirname, '../dist/remote.js')
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
        "window": ["remoteDOM", "window"],
        "document": ["remoteDOM", "document"]
    })
  ]
};
