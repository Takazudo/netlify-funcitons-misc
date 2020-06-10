const Sentry = require("@sentry/node");
const fetch = require("node-fetch");
const { wait } = require("../utils");

const { SENTRY_DSN } = process.env;
let sentryInitialized = false;

function initSentry() {
  if (SENTRY_DSN) {
    Sentry.init({ dsn: SENTRY_DSN });
    sentryInitialized = true;
  }
}

async function reportError(error) {
  console.warn(error);
  if (!sentryInitialized) return;
  if (typeof error === 'string') {
      Sentry.captureMessage(error);
  } else {
      Sentry.captureException(error);
  }
  await Sentry.flush();
}

function catchErrors(handler) {
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

exports.handler = catchErrors(async (event) => {
  initSentry();
  //context.callbackWaitsForEmptyEventLoop = false;
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 400,
      body: "Must POST to this function",
    };
  }

  const envUrl = event.headers["x-debug-env-url"] || process.env.URL;
  let baseUrl = `${envUrl}/.netlify/functions`;

  const URL = {
    CREATE_CARD: `${baseUrl}/trello-create-bookmark-card`,
    UPDATE_CARD_DESC: `${baseUrl}/trbkmk-steps-update-card-desc`,
    EXPAND_ATTACHED_URL: `${baseUrl}/trbkmk-steps-expand-attached-url`,
    SEND_MAIL: `${baseUrl}/send-mail-notification`,
  };

  const commonRequestHeaders = {
    "x-appsecret": event.headers["x-appsecret"],
    Accept: "application/json",
  };
  if (event.headers["x-debug-env-url"]) {
    commonRequestHeaders["x-debug-env-url"] = envUrl;
  }

  const sendCardCreationRequest = async (url, targetList, desc) => {
    const requestBody = { url, targetList };
    if (desc) {
      requestBody.desc = desc;
    }
    const response = await fetch(URL.CREATE_CARD, {
      method: "post",
      headers: commonRequestHeaders,
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: response.statusText,
      };
    }
    return await response.json();
  };

  const updateCardDesc = async (idCard) => {
    //console.log(`idCard: ${idCard}`);
    const response = await fetch(URL.UPDATE_CARD_DESC, {
      method: "post",
      headers: commonRequestHeaders,
      body: JSON.stringify({ idCard }),
    });
    return response.json();
  };

  const expandAttachedUrl = async (idCard, url) => {
    //console.log(`idCard: ${idCard}`);
    const response = await fetch(URL.EXPAND_ATTACHED_URL, {
      method: "post",
      headers: commonRequestHeaders,
      body: JSON.stringify({ idCard, url }),
    });
    return response.json();
  };

  const sendMail = async (cardName, url) => {
    const response = await fetch(URL.SEND_MAIL, {
      method: "post",
      headers: commonRequestHeaders,
      body: JSON.stringify({
        subject: `⭐️ ${cardName}`,
        text: url,
      }),
    });
    return response.json();
  };

  const { url, targetList, desc } = JSON.parse(event.body);
  const { cardData } = await sendCardCreationRequest(url, targetList, desc);
  const idCard = cardData.id;

  // notify that we made a card via mail
  sendMail(cardData.name, url);

  // invoke extras
  updateCardDesc(idCard);
  expandAttachedUrl(idCard, url);

  // we need a tiny delay to invoke above extras
  await wait(500);

  return {
    statusCode: 400,
    body: JSON.stringify({ result: true }),
  };
});
