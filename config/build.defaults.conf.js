// © Andrew Wei

/**
 * @file Default configuration for the build task. Override these in the target
 *       project.
 */

module.exports = {
  input: {
    baseDir: `app`,
    assetsDir: `assets`,
    manifestDir: `manifest`,
    entriesDir: `assets`,
    viewsDir: `views`
  },
  output: {
    baseDir: `public`,
    assetsDir: `assets`,
    staticDir: ``
  },
  config: {
    baseDir: `config`,
    localesDir: `locales`,
    appConfigFile: `app.conf`
  },
  static: {
    baseDir: `static`,
    ignore: [`.*`]
  },
  build: {
    publicPath: process.env.PUBLIC_PATH || `/`,
    linter: true,
    gzip: false,
    gzipExtensions: [`js`, `css`],
    analyzer: false
  },
  dev: {
    publicPath: `/`,
    linter: false,
    port: 8080
  }
};