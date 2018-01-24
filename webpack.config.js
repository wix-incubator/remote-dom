const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    local: './src/local.js',
    remote: './src/remote.js',
    bundle: './src/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "[name].min.js",
    libraryTarget: 'umd',
    library: '[name]DOM'
  },
  devtool: 'source-map',
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015', 'stage-2']
      }
    }
    ]
  },
  plugins: [new webpack.optimize.UglifyJsPlugin({
    minimize: true,
    sourceMap: true
  })]
};
