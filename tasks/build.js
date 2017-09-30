// © Andrew Wei

/**
 * @file This task compiles source files into production-ready files.
 */

const log = require(`../utils/log`);
const webpack = require(`webpack`);

function compile(config) {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) return reject(err.stack || err);
      if (stats.hasErrors()) return reject(stats.toString({ chunks: false, colors: true }));
      resolve(stats.toString({ chunks: false, colors: true }));
    });
  });
}

module.exports = async function(config, cwd) {
  log.info(`Building...`);
  
  try {
    const res = await compile(require(`../config/build.conf`)(config, cwd));
    console.log(res);
    log.succeed(`Build complete`);
  }
  catch (err) {
    console.error(err);
    log.fail(`Build failed`);
    process.exit(1);
  }
};
