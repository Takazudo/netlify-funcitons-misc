const fetch = require("node-fetch");

const raiseError = (message) => {
  console.error(message);
};

//const updateCardDesc = async (cardId, url) => {
//  const url = `${process.env.URL}${path}`;
//  console.log("sending fetchPageText request to:", url);
//  return fetch(url, {
//    method: "post",
//    headers: {
//      "x-strategy": "fetchPageText",
//      Accept: "application/json",
//    },
//    body: JSON.stringify({
//      secret: process.env.TWEET_TO_TRELLO_SECRET,
//      cardId,
//    }),
//  });
//};

exports.handler = (event) => {
  if (event.httpMethod !== "POST") {
    raiseError("ERR: method is not post");
    return {
      statusCode: 400,
      body: "Must POST to this function",
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify(process.env)
  };

};