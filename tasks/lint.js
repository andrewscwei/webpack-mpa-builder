// © Andrew Wei

/**
 * @file This task lints the input directory with the option to apply fixes.
 */

const chalk = require(`chalk`);
const log = require(`../utils/log`);
const path = require(`path`);
const spawn = require(`../utils/spawn`);

module.exports = async function(config, cwd, shouldLintFix) {
  const inputDir = path.join(cwd, config.input.baseDir);

  log.info(shouldLintFix ? `Linting and fixing ${chalk.cyan(inputDir)}...` : `Linting ${chalk.cyan(inputDir)}...`);

  let command = `eslint`;
  let args = [
    `-f`, path.resolve(cwd, `node_modules/eslint-friendly-formatter`)
  ];

  if (shouldLintFix) args.push(`--fix`);
  args.push(inputDir);

  await spawn(command, args, { stdio: `inherit` });
  log.succeed(`Linter completed successfully`);
};
