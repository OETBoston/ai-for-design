const webpack = require('webpack');

module.exports = {
  entry: './src/index.js', // Update with your entry file
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js', // Update with your output file
  },
  resolve: {
    fallback: {
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
      "util": require.resolve("util/"),
      "crypto": require.resolve("crypto-browserify"),
      "url": require.resolve("url/"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "path": require.resolve("path-browserify"),
      "net": false,
      "tls": false,
      "fs": false,
      "dns": false
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
};
