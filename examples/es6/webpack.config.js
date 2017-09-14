module.exports = {
  entry: {
    'todomvc-worker': './src/todomvc/worker',
    'todomvc': './src/todomvc/index',
    'video-worker': './src/video/worker',
    'video': './src/video/index'
  },
  devtool: 'inline-source-map',
  output: {
    path: './dist',
    filename: '[name]-bundle.js',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [ {test: /\.jsx?$/,
      exclude: /(node_modules)/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015']
      }}
    ]
  }
};
