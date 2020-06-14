const Sentry = require("@sentry/node");
const { SENTRY_DSN } = process.env;

let sentryInitialized = false;

const commonSuccessResponse = {
  statusCode: 200,
  body: JSON.stringify({ result: true }),
};

const commonErrorResponse = {
  statusCode: 400,
  body: JSON.stringify({ result: false }),
};

const wait = async (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const initSentry = () => {
  if (!SENTRY_DSN) {
    return;
  }
  Sentry.init({ dsn: SENTRY_DSN });
  sentryInitialized = true;
};

const reportError = async (error) => {
  console.warn(error);
  if (!sentryInitialized) return;
  if (typeof error === "string") {
    Sentry.captureMessage(error);
  } else {
    Sentry.captureException(error);
  }
  await Sentry.flush();
};

const catchErrors = (handler) => {
  return async function (event, context) {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
      return await handler.call(this, ...arguments);
    } catch (e) {
      // This catches both sync errors & promise
      // rejections, because we 'await' on the handler
      await reportError(e);
      return commonErrorResponse;
    }
  };
};

const createBaseUrl = (event) => {
  const envUrl = createEnvUrl(event);
  return `${envUrl}/.netlify/functions`;
};

const createEnvUrl = (event) => {
  return event.headers["x-debug-env-url"] || process.env.URL;
};

const createCommonRequestHeaders = (event) => {
  const envUrl = createEnvUrl(event);
  const headers = {
    "x-appsecret": event.headers["x-appsecret"],
    Accept: "application/json",
  };
  if (event.headers["x-debug-env-url"]) {
    headers["x-debug-env-url"] = envUrl;
  }
  return headers;
};

const isValidUser = (event) => {
  const appSecret = event.headers["x-appsecret"];
  if (appSecret === process.env.APP_SECRET) {
    return true;
  }
  reportError(new Error("invalid appsecret"));
  return false;
};

module.exports = {
  wait,
  reportError,
  initSentry,
  catchErrors,
  commonErrorResponse,
  createBaseUrl,
  createCommonRequestHeaders,
  commonSuccessResponse,
  isValidUser,
};
