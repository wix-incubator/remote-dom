const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: "bundle.js",
    libraryTarget: 'umd',
    library: 'remoteDOM'
  },
  devtool: 'source-map',
  module: {
    loaders: [ {test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015']
      }}
    ]
  },
  plugins: [new webpack.optimize.UglifyJsPlugin({
    minimize: true,
    sourceMap: true
  })]
};
