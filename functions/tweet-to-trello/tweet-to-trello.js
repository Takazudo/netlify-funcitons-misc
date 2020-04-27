const {
  createParams,
  fetchHtml,
  createFormattedTextFromHtml,
  combineText,
  createTrelloCard,
  isValidSecret,
  createDataFromBodyText,
  createDataFromJSON,
  unshortenUrl,
} = require("./utils");

const fetch = require("node-fetch");

const { notifyFailure } = require("./mail-sender");

const raiseError = (message) => {
  console.log(message);
  notifyFailure(message);
};

const sendFetchPageTextRequest = async (cardId, path) => {
  const url = `${process.env.URL}${path}`;
  console.log("sending fetchPageText request to:", url);
  return fetch(url, {
    method: "post",
    headers: {
      "x-strategy": "fetchPageText",
      Accept: "application/json",
    },
    body: JSON.stringify({
      secret: process.env.TWEET_TO_TRELLO_SECRET,
      cardId,
    }),
  });
};

const sendExpandUrlRequest = async (cardId, path) => {
  const url = `${process.env.URL}${path}`;
  console.log("sending expandUrl request to:", url);
  return fetch(url, {
    method: "post",
    headers: {
      "x-strategy": "expandUrl",
      Accept: "application/json",
    },
    body: JSON.stringify({
      secret: process.env.TWEET_TO_TRELLO_SECRET,
      cardId,
    }),
  });
};

exports.handler = async (event) => {
  console.log("=== request accepted ===");

  if (event.httpMethod !== "POST") {
    raiseError("ERR: method is not post");
    return {
      statusCode: 400,
      body: "Must POST to this function",
    };
  }

  const strategy = event.headers["x-strategy"] || "bookmark";

  switch (strategy) {
    case "bookmark":
      console.log("==== strategy: bookmark ====");
      Promise.all;
      const resp = await require("./handleBookmark")({ event });
      await Promise.all([
        sendFetchPageTextRequest(resp.body.cardId, event.path),
        sendExpandUrlRequest(resp.body.cardId, event.path)
      ]);
      break;
    case "expandUrl":
      console.log("==== strategy: expandUrl ====");
      await require("./handleExpandUrl")({ event });
      break;
    case "fetchPageText":
      console.log("==== strategy: fetchPageText ====");
      await require("./handleFetchPageText")({ event });
      break;
    default:
      break;
  }

  return {
    statusCode: 200,
    body: "done",
  };
};
