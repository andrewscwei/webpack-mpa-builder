// © Andrew Wei

/**
 * @file This task compiles wipes the built files.
 */

const chalk = require(`chalk`);
const del = require(`del`);
const log = require(`../utils/log`);
const path = require(`path`);

module.exports = async function(config, cwd) {
  const outputDir = path.join(cwd, config.output.baseDir);

  log.info(`Cleaning ${chalk.cyan(outputDir)}...`);
  
  try {
    await del([outputDir]);
    log.succeed(`Clean complete`);
  }
  catch (err) {
    console.error(err);
    log.fail(`Clean failed`);
    process.exit(1);
  }
};
