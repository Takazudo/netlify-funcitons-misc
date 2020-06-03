const fetch = require("node-fetch");

const raiseError = (message) => {
  console.error(message);
};

const fetchCard = async (cardId) => {
  const params = new URLSearchParams();
  const { TRELLO_API_KEY: key, TRELLO_API_TOKEN: token } = process.env;
  params.append("key", process.env.TRELLO_API_KEY);
  params.append("token", process.env.TRELLO_API_TOKEN);
  params.append("attachments", "true");
  const response = await fetch(`https://api.trello.com/1/card/${cardId}?${params}`, {
    method: "get",
    headers: { Accept: "application/json" }
  });
  return response;
};

exports.handler = async (event) => {
  // check method
  if (event.httpMethod !== "GET") {
    raiseError("ERR: method is not get");
    return {
      statusCode: 400,
      body: "Must GET to this function",
    };
  }

  const { idCard } = event.queryStringParameters;

  // check params
  if (!idCard) {
    raiseError("ERR: params not enough: idCard");
    return;
  }

  // check secret
  const appSecret = event.headers["x-appsecret"];
  if (appSecret !== process.env.APP_SECRET) {
    raiseError("ERR: appSecret invalid");
    return {
      statusCode: 400,
      body: "appSecret invalid",
    };
  }

  const response = await fetchCard(idCard);

  // something wrong
  if (!response.ok) {
    raiseError(`ERR: trello api says response.ok is false ${urlSource}`);
    return {
      statusCode: response.status,
      body: response.statusText,
    };
  }

  const cardData = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify({ cardData }),
  };
};
