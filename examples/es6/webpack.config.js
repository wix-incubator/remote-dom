module.exports = {
  entry: {
    demo: './src/index.js'
  },
  devtool: 'source-map',
  output: {
    path: './dist',
    filename: 'app-bundle.js',
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
  }
};
