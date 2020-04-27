const { sendFetchPageTextRequest, sendExpandUrlRequest } = require("./utils");
const fetch = require("node-fetch");
const { notifyFailure } = require("./mail-sender");

const raiseError = (message) => {
  console.log(message);
  notifyFailure(message);
};

exports.handler = (event, context, callback) => {
  if (event.httpMethod !== "POST") {
    raiseError("ERR: method is not post");
    callback(null, {
      statusCode: 400,
      body: "Must POST to this function",
    });
  }

  const strategy = event.headers["x-strategy"] || "bookmark";

  console.log(`==== ${strategy} ====`);

  const okRespnose = {
    statusCode: 200,
    body: "done",
  };

  switch (strategy) {
    case "bookmark":
      require("./handleBookmark")({ event })
        .then((cardId) => {
          return Promise.all([
            sendFetchPageTextRequest(cardId, event.path),
            sendExpandUrlRequest(cardId, event.path),
          ]);
        })
        .then(() => {
          console.log(`==== /${strategy} ====`);
          callback(null, okRespnose);
        });
      break;
    case "expandUrl":
      require("./handleExpandUrl")({ event }).then(() => {
        console.log(`==== /${strategy} ====`);
        callback(null, okRespnose);
      });
      break;
    case "fetchPageText":
      require("./handleFetchPageText")({ event }).then(() => {
        console.log(`==== /${strategy} ====`);
        callback(null, okRespnose);
      });
      break;
    default:
      break;
  }
};
