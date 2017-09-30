// © Andrew Wei

/**
 * @file Webpack hot middleware client.
 */

require(`eventsource-polyfill`);

const hotClient = require(`webpack-hot-middleware/client?noInfo=true&reload=true`);

hotClient.subscribe(function(event) {
  if (event.action === `reload`) {
    /* eslint-disable no-undef */
    window.location.reload();
  }
});
