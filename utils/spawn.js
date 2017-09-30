// © Andrew Wei

/**
 * @file Simple wrapper to promisify `spawn`.
 */

const { spawn } = require(`child_process`);

module.exports = function() {
  return new Promise((resolve, reject) => {
    const proc = spawn.apply(null, arguments);

    proc.on(`error`, (err) => {
      return reject(err);
    });

    proc.on(`exit`, (code) => {
      if (code !== 0) return reject(new Error(`Process exited without code 0, something bad happened`));
      return resolve();
    });
  });
};