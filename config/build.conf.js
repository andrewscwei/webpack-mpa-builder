// © Andrew Wei

/**
 * @file This is the config for Webpack to build the app for both development 
 *       and production.
 */

'use strict';

const fs = require(`fs`);
const path = require(`path`);
const webpack = require(`webpack`);
const i18n = require(`i18n`);
const glob = require(`glob`);
const log = require(`../utils/log`);

const BundleAnalyzerPlugin = require(`webpack-bundle-analyzer`).BundleAnalyzerPlugin;
const CompressionPlugin = require(`compression-webpack-plugin`);
const CopyPlugin = require(`copy-webpack-plugin`);
const ExtractTextPlugin = require(`extract-text-webpack-plugin`);
const HTMLPlugin = require(`html-webpack-plugin`);
const OptimizeCSSPlugin = require(`optimize-css-assets-webpack-plugin`);

module.exports = function(config, cwd) {
  // Determine whether this is development environment.
  const debug = process.env.NODE_ENV === `development`;

  let appConfig = {};

  try {
    appConfig = Object.assign(appConfig, require(path.join(cwd, config.config.baseDir, config.config.appConfigFile)));
  }
  catch (e) {
    log.info(`No app config found`);
  }

  // Paths.
  const sourceDir = path.join(cwd, config.input.baseDir);
  const buildDir = path.join(cwd, config.output.baseDir);
  const configDir = path.join(cwd, config.config.baseDir);
  const staticDir = path.join(cwd, config.static.baseDir);

  // Fetch all the entry files. 
  const entries = glob.sync(path.join(sourceDir, config.input.entriesDir || ``, `*.*`));

  // Fetch all the pages.
  const pages = glob.sync(path.join(sourceDir, config.input.viewsDir, `*.*`));

  // Set up i18n, fetch all the languages from `config/locales`.
  const languages = glob.sync(path.join(configDir, config.config.localesDir, `*.*`)).map(file => (path.parse(file).name));
  i18n.configure({
    defaultLocale: config.defaultLocale,
    locales: languages,
    directory: path.join(configDir, config.config.localesDir),
    register: global
  });

  function javascriptLoaders() {
    return [{
      loader: `babel-loader`,
      options: { presets: [`env`] }
    }];
  }

  function eslintLoaders() {
    return [{
      loader: `eslint-loader`,
      options: {
        formatter: require(`eslint-friendly-formatter`)
      }
    }];
  }

  function stylesheetLoaders(options = { inline: false, sourceMap: false, minify: true }) {
    const loaders = [{
      loader: `css-loader`,
      options: { sourceMap: options.sourceMap, minimize: options.minify }
    }, {
      loader: `postcss-loader`,
      options: { 
        plugins: () => ([
          require(`autoprefixer`)({})
        ]) 
      }
    }, {
      loader: `sass-loader`,
      options: { 
        includePaths: [
          path.join(sourceDir, config.input.assetsDir)
        ],
        outputStyle: (options.minify ? `compressed` : `expanded`) + (options.sourceMap ? `,sourceMap` : ``)
      }
    }];

    if (options.inline) {
      loaders.unshift({
        loader: `style-loader`
      });

      return loaders;
    }
    else {
      return ExtractTextPlugin.extract({
        fallback: `style-loader`,
        use: loaders
      });
    }
  }

  function templateLoaders() {
    return javascriptLoaders().concat([{
      loader: `pug-loader`,
      options: { 
        root: sourceDir 
      }
    }]);
  }

  function fileLoaders(options = { outputDir: `` }) {
    return [{
      loader: `file-loader`,
      options: {
        name: path.posix.join(options.outputDir, `[name].[hash:7].[ext]`)
      }
    }];
  }

  function urlLoaders(options = { outputDir: `` }) {
    return [{
      loader: `url-loader`,
      options: {
        limit: 10000,
        name: path.posix.join(options.outputDir, `[name].[hash:7].[ext]`)
      }
    }];
  }

  return {
    devtool: debug ? `cheap-eval-source-map` : false,
    context: sourceDir,
    
    stats: {
      colors: true,
      modules: true,
      reasons: true,
      errorDetails: true
    },

    // Create an entry for every page.
    entry: entries.reduce((output, entryPath) => {
      const entry = path.parse(entryPath).name;
      output[entry] = debug ? [path.join(__dirname, `../tasks`, `dev-client`)].concat([entryPath]) : entryPath;
      return output;
    }, {}),

    output: {
      path: path.join(buildDir),
      publicPath: debug ? config.dev.publicPath : config.build.publicPath,
      filename: debug ? `[name].js` : path.posix.join(config.output.assetsDir, `[name].[chunkhash].js`),
      chunkFilename: debug ? `[chunkhash].js` : path.posix.join(config.output.assetsDir, `[id].[chunkhash].js`),
      sourceMapFilename: debug ? `[name].map` : path.posix.join(config.output.assetsDir, `[name].[hash].map`)
    },

    module: {
      rules: [{
        test: /\.js$/,
        exclude: [
          /node_modules/,
          path.join(sourceDir, config.input.manifestDir)
        ],
        use: javascriptLoaders()
      }, {
        test: /\.pug$/,
        exclude: [
          /node_modules/,
          path.join(sourceDir, config.input.manifestDir)
        ],
        use: templateLoaders()
      }, {
        test: /\.(scss|sass)$/,
        use: stylesheetLoaders({
          inline: debug,
          sourceMap: debug,
          minify: !debug
        })
      }, {
        test: /\.*/,
        include: [path.join(sourceDir, config.input.manifestDir)],
        use: fileLoaders()
      }, {
        test: /\.(jpe?g|png|gif|svg|ico)(\?.*)?$/,
        exclude: [path.join(sourceDir, config.input.manifestDir)],
        use: urlLoaders({ outputDir: path.join(config.output.assetsDir, `images`) })
      }, { 
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        exclude: [path.join(sourceDir, config.input.manifestDir)],
        use: urlLoaders({ outputDir: path.join(config.output.assetsDir, `media`) })
      }, {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        exclude: [path.join(sourceDir, config.input.manifestDir)],
        use: urlLoaders({ outputDir: path.join(config.output.assetsDir, `fonts`) })
      }]
        .concat((debug && config.dev.linter) ? [{
          test: /\.js/,
          include: [sourceDir],
          exclude: [path.join(sourceDir, config.input.manifestDir)],
          enforce: `pre`,
          use: eslintLoaders()
        }] : [])
    },
    resolve: {
      extensions: [`.js`, `.sass`, `.scss`, `.pug`],
      modules: [
        sourceDir,
        path.join(cwd, `node_modules`),
        path.join(__dirname, `../`, `node_modules`)
      ],
      alias: {
        
      }
    },
    plugins: [
      new webpack.DefinePlugin({ 
        'process.env': {
          NODE_ENV: debug ? JSON.stringify(`development`) : JSON.stringify(`production`) 
        },
        '$config': JSON.stringify(appConfig)
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name: `common`,
        minChunks: (module) => {
          return (module.resource && /\.js$/.test(module.resource) && module.resource.indexOf(path.resolve(cwd, `node_modules`)) === 0);
        }
      }),
      // Extract webpack runtime and module manifest to its own file in order to
      // prevent vendor hash from being updated whenever app bundle is updated.
      new webpack.optimize.CommonsChunkPlugin({
        name: `manifest`,
        chunks: [`common`]
      })
    ]
      .concat(fs.existsSync(staticDir) ? [
        new CopyPlugin([{
          from: staticDir,
          to: path.join(buildDir, config.output.staticDir),
          ignore: config.static.ignore
        }])
      ] : [])
      .concat(debug ? [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
      ] : [
        new ExtractTextPlugin({
          filename: path.posix.join(config.output.assetsDir, `stylesheets`, `[name].[contenthash].css`)
        }),
        new OptimizeCSSPlugin({
          cssProcessorOptions: {
            safe: true
          }
        }),
        new webpack.optimize.UglifyJsPlugin({ 
          compress: { 
            warnings: false 
          } 
        })
      ])
      .concat((!debug && config.build.gzip) ? [
        new CompressionPlugin({
          asset: `[path].gz[query]`,
          algorithm: `gzip`,
          test: new RegExp(`\\.(${config.build.gzipExtensions.join(`|`)})$`),
          threshold: 10240,
          minRatio: 0.8
        })
      ] : [])
      .concat((!debug && config.build.analyzer) ? [
        new BundleAnalyzerPlugin()
      ] : [])
      .concat([].concat.apply([], languages.map(language => {
        return pages.map(page => {
          const subdir = language === config.defaultLocale ? `` : `${language}`;
          const pageName = path.parse(page).name;
          const entryNames = entries.map(entry => path.parse(entry).name);
      
          const mappings = {
            [path.parse(config.input.viewIndexFile).name]: path.join(subdir, `index.html`),
            '404': path.join(subdir, `404.html`)
          };

          return new HTMLPlugin({
            filename: path.join(buildDir, mappings.hasOwnProperty(pageName) ? mappings[pageName] : path.join(subdir, pageName, `index.html`)),
            template: page,
            chunks: [`manifest`, `common`].concat(~entryNames.indexOf(pageName) ? pageName : []),
            inject: true,
            minify: {
              removeComments: true,
              collapseWhitespace: true,
              removeAttributeQuotes: true
            },
            // Custom properties for templates
            __: function() {
              i18n.setLocale(language);
              return i18n.__.apply(i18n, arguments);
            },
            __n: function() {
              i18n.setLocale(language);
              return i18n.__n.apply(i18n, arguments);
            }
          });
        });
      })))
  };
};