module.exports = {
  module: {
    rules: [
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: 'fonts/[name].[ext]',
            },
          },
        ],
      },
    ],
  },
  devServer: {
    allowedHosts: 'all',
  },
};
