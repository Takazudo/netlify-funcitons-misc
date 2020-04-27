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

/*
const sendExtraRequest = () => {
  const { URLSearchParams } = require("url");
  const params = new URLSearchParams();
  console.log('trying to send...')
  console.log(params)
  const fetch = require("node-fetch");
  const promise = fetch("http://localhost:8888/.netlify/functions/tweet-to-trello", {
    method: "POST",
    headers: {
      'x-extrarequest': '1',
      'x-bodyformat': 'JSON',
      Accept: "application/json"
    },
    body: JSON.stringify({
      "secret": process.env.TWEET_TO_TRELLO_SECRET,
      "url": 'https://www.w3schools.com/js/js_switch.asp'
    })
  });
  return promise;
}
*/

const sendFetchPageText = async (cardId, path) => {
  const url = `${process.env.URL}${path}`
  console.log('sendFetchPageTo:', url)
  return fetch(url, {
    method: "post",
    headers: {
      "x-strategy": "fetchPageText",
      Accept: "application/json",
    },
    body: JSON.stringify({
      secret: process.env.TWEET_TO_TRELLO_SECRET,
      cardId
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
      const resp = await require("./handleBookmark")({ event });
      await sendFetchPageText(resp.body.cardId, event.path);
      break;
    case "expandUrl":
      console.log("==== strategy: expandUrl ====");
      //return handleExpandUrl();
      break;
    case "fetchPageText":
      console.log("==== strategy: fetchPageText ====");
      require("./handleFetchPageText")({ event });
      break;
    default:
      break;
  }

  return {
    statusCode: 200,
    body: 'done'
  };

};
