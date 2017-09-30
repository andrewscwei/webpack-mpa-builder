// © Andrew Wei

/**
 * @file Dev task, spins up the Webpack dev server to serve the app with hot 
 *       module reloading enabled.
 */

const express = require(`express`);
const webpack = require(`webpack`);

module.exports = async function(config, cwd) {
  const app = express();
  const port = config.dev.port;
  const webpackConfig = require(`../config/build.conf`)(config, cwd);
  const compiler = webpack(webpackConfig);

  const devMiddleware = require(`webpack-dev-middleware`)(compiler, {
    quiet: false,
    noInfo: true,
    inline: false,
    stats: { colors: true }
  });
  
  const hotMiddleware = require(`webpack-hot-middleware`)(compiler, {
    log: false,
    heartbeat: 2000,
    multistep: false
  });
  
  // Force page reload when html-webpack-plugin template changes.
  compiler.plugin(`compilation`, (compilation) => {
    compilation.plugin(`html-webpack-plugin-after-emit`, (data, done) => {
      hotMiddleware.publish({ action: `reload` });
      done();
    });
  });
  
  // Serve webpack bundle output.
  app.use(devMiddleware);
  
  // Enable hot-reload and state-preserving compilation error display.
  app.use(hotMiddleware);
  
  app.listen(port);
};
