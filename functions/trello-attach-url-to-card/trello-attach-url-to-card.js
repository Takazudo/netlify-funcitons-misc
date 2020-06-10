const fetch = require("node-fetch");

const raiseError = (message) => {
  console.error(message);
};

const createParams = (url) => {
  const params = new URLSearchParams();
  const { TRELLO_API_KEY: key, TRELLO_API_TOKEN: token } = process.env;
  params.append("key", key);
  params.append("token", token);
  params.append("url", url);
  return params;
};

const attachUrlToCard = async (params, idCard) => {
  const response = await fetch(
    `https://api.trello.com/1/cards/${idCard}/attachments`,
    {
      method: "post",
      headers: { Accept: "application/json" },
      body: params,
    }
  );
  return response;
};

exports.handler = async (event) => {
  // check method
  if (event.httpMethod !== "POST") {
    raiseError("ERR: method is not post");
    return {
      statusCode: 400,
      body: "Must POST to this function",
    };
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

  const { url, idCard } = JSON.parse(event.body);

  // check params
  if (!url) {
    raiseError("ERR: params not enough: url");
    return;
  }
  if (!idCard) {
    raiseError("ERR: params not enough: url");
    return;
  }

  const params = createParams(url);
  const response = await attachUrlToCard(params, idCard);

  // something wrong
  if (!response.ok) {
    raiseError(`ERR: trello api says response.ok is false ${urlSource}`);
    return {
      statusCode: response.status,
      body: response.statusText,
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ result: true }),
  };
};
