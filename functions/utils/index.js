const Sentry = require("@sentry/node");
const { SENTRY_DSN } = process.env;

let sentryInitialized = false;

const reportError = async (error) => {
  console.warn(error);
  if (!sentryInitialized) return;
  if (typeof error === 'string') {
      Sentry.captureMessage(error);
  } else {
      Sentry.captureException(error);
  }
  await Sentry.flush();
}

module.exports = {
  wait: async (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  },
  initSentry: () => {
    if (!SENTRY_DSN) { return; }
    Sentry.init({ dsn: SENTRY_DSN });
    sentryInitialized = true;
  },
  catchErrors: (handler) => {
    return async function(event, context) {
      context.callbackWaitsForEmptyEventLoop = false;
      try {
        return await handler.call(this, ...arguments);
      } catch(e) {
        // This catches both sync errors & promise
        // rejections, because we 'await' on the handler
        await reportError(e);
        throw e;
      }
    };
  }

};
