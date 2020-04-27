const { sendFetchPageTextRequest, sendExpandUrlRequest } = require("./utils");
const { notifyFailure, notifyOk } = require("./mail-sender");
const handleBookmark = require('./handleBookmark')
const handleExpandUrl = require('./handleExpandUrl')
const handleFetchPageText = require('./handleFetchPageText')

const raiseError = (message) => {
  console.log(message);
  notifyFailure(message);
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false

  if (event.httpMethod !== "POST") {
    raiseError("ERR: method is not post");
    return {
      statusCode: 400,
      body: "Must POST to this function",
    }
  }

  const strategy = event.headers["x-strategy"] || "bookmark";

  console.log(`==== ${strategy} ====`);

  switch (strategy) {
    case "bookmark":
      const { cardId, cardName } = await handleBookmark({ event })
      notifyOk(cardName)
      await Promise.all([
        sendFetchPageTextRequest(cardId, event.path),
        sendExpandUrlRequest(cardId, event.path),
      ]);
      break;
    case "expandUrl":
      await handleExpandUrl({ event })
      break;
    case "fetchPageText":
      await handleFetchPageText({ event })
      break;
    default:
      break;
  }

  console.log(`==== /${strategy} ====`);

  return {
    statusCode: 200,
    body: "done",
  };


};
