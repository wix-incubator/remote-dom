const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: './src/index.js',
  output: {
    path: './dist',
    filename: "bundle.js",
    libraryTarget: 'umd',
    library: 'remoteDOM'
  },
  module: {
    loaders: [ {test: /\.js$/,
      exclude: /(node_modules)/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015']
      }}
    ]
  }
};
