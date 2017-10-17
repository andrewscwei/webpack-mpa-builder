#!/usr/bin/env node

const chalk = require(`chalk`);
const config = require(`./config/build.defaults.conf`);
const fs = require(`fs`);
const log = require(`./utils/log`);
const merge = require(`webpack-merge`);
const path = require(`path`);
const program = require(`commander`);
const version = require(`./package.json`).version;

// Root path of the project.
let baseDir = process.cwd();

// Default input CLI command.
let command = ``;

// Default path to the input directory from command arg.
let inputDir = undefined;

// Default path to the output directory from command arg.
let outputDir = undefined;

// Default path to the config file.
let configFile = `config/build.conf`;

// Specifies whether the linter (if executed) should attempt fixes.
let shouldLintFix = false;

// Specifies the bundle analyzer to run on build.
let shouldAnalyze = false;

// Resolve CLI command and options.
function resolveOptions(cmd, options) {
  if (typeof cmd !== undefined) command = cmd;
  if (options.inputDir !== undefined) inputDir = options.inputDir;
  if (options.outputDir !== undefined) outputDir = options.outputDir;
  if (options.configFile !== undefined) configFile = options.configFile;
  shouldAnalyze = options.analyze;
  shouldLintFix = options.fix;
}

// Main process.
async function main() {
  let c = Object.assign({}, config);

  // Resolve config.
  let hasConfig = false;

  try {
    const projectConfig = require(path.resolve(baseDir, configFile));
    c = merge.strategy({
      'static.ignore': `replace`,
      'build.gzipExtensions': `replace`
    })(c, projectConfig);

    hasConfig = true;
  }
  catch (error) {}

  if (inputDir) c.input.baseDir = inputDir;
  if (outputDir) c.output.baseDir = outputDir;
  if (shouldAnalyze) c.build.analyzer = true;

  // Catch unsupported commands.
  const supportedCommands = [`clean`, `build`, `dev`, `lint`, ``];

  if (!~supportedCommands.indexOf(command)) {
    log.error(`Unrecognized command ${chalk.cyan(command)}. Try ${chalk.cyan(`webpack-mpa-builder --help`)}`);
    process.exit(1);
  }

  // Sanity checks.
  if (!fs.existsSync(c.input.baseDir)) {
    log.error(`Input directory ${chalk.cyan(c.input.baseDir)} does not exist`);
    process.exit(1);
  }

  log.info(`${chalk.cyan(`v${chalk.cyan(version)}`)}: Using input dir ${chalk.cyan(c.input.baseDir)} and ouptut dir ${chalk.cyan(c.output.baseDir)}${hasConfig ? ` with config ${chalk.cyan(configFile)}` : ` with default config`}`);

  // Run the builder as per specified command.
  switch (command) {
  case `clean`:
    await require(`./tasks/clean`)(c, baseDir);
    break;
  case `build`:
    process.env.NODE_ENV = `production`;

    // Run linter first and return if it fails.
    if (c.build.linter) {
      try {
        await require(`./tasks/lint`)(c, baseDir, false);
      }
      catch (err) {
        console.log(`\n`);
        log.error(`Linter failed`);
        console.log(`\n`);
        process.exit(1);
      }
    }

    await require(`./tasks/clean`)(c, baseDir);
    await require(`./tasks/build`)(c, baseDir);
    break;
  case `dev`:
    process.env.NODE_ENV = `development`;
    await require(`./tasks/dev`)(c, baseDir);
    break;
  case `lint`:
    try {
      await require(`./tasks/lint`)(c, baseDir, shouldLintFix);
    }
    catch (err) {}
    break;
  default:
    program.help();
  }
}

program
  .version(version)
  .usage(`[options] <command>\n\n` +
         `  where <command> is one of:\n` +
         `    build:  builds the project in production\n` +
         `      dev:  runs the project on a local dev server with hot module reloading\n` +
         `    clean:  wipes the built files\n` +
         `     lint:  lints the input directory`)
  .arguments(`<cmd>`)
  .option(`-c, --config <config>`, `the config file relative to project root`)
  .option(`-i, --inputDir <inputDir>`, `the input directory relative to project root`)
  .option(`-o, --outputDir <outputDir>`, `the output directory relative to project root`)
  .option(`-a, --analyze`, `specifies whether the bundle analyzer should run on build`)
  .option(`-f, --fix`, `specifies whether the linter should automatically fix issues`)
  .action(resolveOptions)
  .parse(process.argv);

main();
