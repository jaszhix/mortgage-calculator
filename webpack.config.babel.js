import fs from 'fs';
import webpack from 'webpack';
import path from 'path';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import CleanWebpackPlugin from 'clean-webpack-plugin';
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer';
import CompressionPlugin from 'compression-webpack-plugin';
import {StatsWriterPlugin} from 'webpack-stats-plugin';
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';

const ENV = process.env.NODE_ENV || 'development';
const DEV = ENV === 'development';
const PROD = ENV === 'production';

const postcssPlugins = () => {
  let processors = [
    autoprefixer({
      browsers: [
        'ie >= 10',
        'ie_mob >= 10',
        'ff >= 30',
        'chrome >= 34',
        'safari >= 7',
        'opera >= 23',
        'ios >= 7',
        'android >= 4.4',
        'bb >= 10'
      ]
    })
  ];
  if (PROD) {
    processors.push(cssnano({
      safe: true,
      discardComments: {
        removeAll: true
      }
    }));
  }
  return processors;
}

let cssLoaders = [
  {
    loader: 'css-loader',
    options: {
      sourceMap: true,
      importLoaders: 1
    }
  },
  {
    loader: 'postcss-loader',
    options: {
      sourceMap: true,
      plugins: postcssPlugins
    }
  },
];

let scssLoaders = [
  {
    loader: 'css-loader',
    options: {
      sourceMap: true,
      importLoaders: 1
    },
  },
  {
    loader: 'postcss-loader',
    options: {
      sourceMap: true,
      plugins: postcssPlugins
    }
  },
  {
    loader: 'sass-loader',
    options: {
      sourceMap: true,
      includePaths: [
        path.join(__dirname, 'node_modules')
      ],
      outputStyle: PROD ? 'compressed' : 'expanded'
    }
  }
];

if (DEV) {
  cssLoaders = ['style-loader'].concat(cssLoaders);
  scssLoaders = ['style-loader'].concat(scssLoaders);
}

const webpackConfig = {
  mode: ENV,
  entry: {
    app: PROD ? [
      'babel-polyfill',
      path.join(__dirname, 'front-end/index.js')
    ]
    : [
      // Uncomment for IE11 dev
      //  'eventsource-polyfill',
      //  'babel-polyfill',
        'webpack-hot-middleware/client?http://127.0.0.1:8032',
        './index.js',
      ]
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: PROD ? '[hash].js' : 'index.js',
    chunkFilename: PROD ? '[chunkhash].js' : '[name].chunk.js',
    hashDigestLength: 32,
    publicPath: PROD ? '' : 'http://127.0.0.1:8032/'
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.jsx', '.js', '.json'],
    alias: {
      jquery: 'jquery/src/jquery'
    }
  },
  context: path.resolve(__dirname, 'front-end'),
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components|immutable\.js$|draftjs-utils\.js$)/,
        loader: 'babel-loader',
        type: 'javascript/auto'
      },
      {
        test: /\.css$/,
        use: PROD ? ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: cssLoaders
        }) : cssLoaders,
      },
      {
        test: /\.scss$/,
        use: PROD ? ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: scssLoaders
        }) : scssLoaders,
      },
      {
        test: /\.(png|jpg|gif|swf)$/,
        loader: PROD
          ? 'file-loader?name=[hash].[ext]'
          : 'file-loader?name=[name].[ext]'
      },
      {
        test: /\.(ttf|eot|svg|woff(2)?)(\S+)?$/,
        loader: PROD
          ? 'file-loader?name=[hash].[ext]'
          : 'file-loader?name=[name].[ext]'
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(ENV)
      }
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'front-end/index.html')
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })
  ],
  node: {
    net: 'mock',
    dns: 'mock'
  },
  devtool: DEV ? 'inline-source-map' : 'source-map',
  stats: {
    children: false
  },
  optimization: {
    splitChunks: {
      chunks: 'async',
      minSize: 30000,
      minChunks: 2,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      name: true,
      cacheGroups: {
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          chunks: 'all'
        }
      }
    }
  }
};

if (DEV) {
  webpackConfig.plugins = webpackConfig.plugins.concat([
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ]);
}

if (PROD) {
  webpackConfig.optimization.minimize = false;
  webpackConfig.plugins = webpackConfig.plugins.concat([
    new CompressionPlugin(),
    new BundleAnalyzerPlugin({
      openAnalyzer: false,
      analyzerMode: 'static',
      reportFilename: `./bundleReport.html`
    }),
    new CleanWebpackPlugin(['dist'], {
      verbose: false
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new UglifyJsPlugin({
      sourceMap: true,
      uglifyOptions: {
        compress: {
          warnings: false,
          drop_console: true,
          drop_debugger: true,
          dead_code: true,
          unused: true,
        },
        output: {
          comments: false
        }
      }
    }),
    new ExtractTextPlugin({filename: '[name]---[hash].css', allChunks: false}),
  ]);
}

webpackConfig.plugins.push(new webpack.LoaderOptionsPlugin({
  debug: DEV,
}));

webpackConfig.plugins.push(new StatsWriterPlugin({
  fields: ['assetsByChunkName', 'publicPath'],
  transform(data, opts) {
    let json = JSON.stringify({
      app: `${data.publicPath}${data.assetsByChunkName.app[0]}`,
      css: `${data.publicPath}${data.assetsByChunkName.app[1]}`
    }, null, 2);
    fs.writeFile(path.join(__dirname, 'webpack-stats.json'), json, 'utf8', () => {
      console.log('Generated stats.json')
    });
    return json;
  }
}));

export default webpackConfig;
