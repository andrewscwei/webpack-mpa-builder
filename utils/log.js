// © Andrew Wei

/**
 * @file Custom logging.
 */

const chalk = require(`chalk`);
const prefix = `[${require(`../package.json`).name}] `;

function parseMessage(data, noPrefix, color) {
  const padding = new Array(prefix.length + 1).join(` `);

  let message = ``;
  
  if (data.split) {
    data = data.split(/\r?\n/);

    data.forEach((line, idx) => {
      message += (idx === 0 && !noPrefix) ? chalk[color || `blue`](prefix) : padding;
      message += `${line}`;
      if (idx !== (data.length - 1)) message += `\n`;
    });
  }
  else {
    message += !noPrefix ? chalk[color || `blue`](prefix) : padding;
    message += `${data}`;
  }

  return message;
}

exports.info = function(data, noPrefix, color) {
  const message = parseMessage(data, noPrefix, color);
  if (/[0-9A-z]+/.test(message)) console.log(`${message}`);
};

exports.succeed = function(data) {
  const message = parseMessage(data, true);
  console.log(`\n${chalk.green(message)}`);
};

exports.fail = function(data) {
  const message = parseMessage(data, true);
  console.log(`\n${chalk.red(message)}`);
};

exports.warn = function(data, noPrefix) {
  const message = parseMessage(data, noPrefix, `yellow`);
  if (/[0-9A-z]+/.test(message)) console.warn(`${chalk.yellow(message)}`);
};
  
exports.error = function(data, noPrefix) {
  const message = parseMessage(data, noPrefix, `red`);
  if (/[0-9A-z]+/.test(message)) console.error(`${chalk.red(message)}`);
};
