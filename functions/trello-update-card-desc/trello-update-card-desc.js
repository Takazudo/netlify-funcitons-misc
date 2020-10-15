const fetch = require("node-fetch");
const { initSentry, catchErrors } = require("../utils");

const raiseError = (message) => {
  console.error(message);
};

const sendRequest = async ({ idCard, desc }) => {
  const params = new URLSearchParams();
  params.append("key", process.env.TRELLO_API_KEY);
  params.append("token", process.env.TRELLO_API_TOKEN);
  params.append("desc", desc);

  const response = await fetch(`https://api.trello.com/1/cards/${idCard}`, {
    method: "put",
    headers: { Accept: "application/json" },
    body: params,
  });
  return response;
};

exports.handler = catchErrors(async (event) => {
  initSentry();

  // check method
  if (event.httpMethod !== "PUT") {
    raiseError("ERR: method is not PUT");
    return {
      statusCode: 400,
      body: "Must PUT to this function",
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

  const { idCard, desc } = JSON.parse(event.body);

  // check params
  if (!idCard) {
    raiseError("ERR: params not enough: url");
    return;
  }
  if (!desc) {
    raiseError("ERR: params not enough: desc");
    return;
  }
  const response = await sendRequest({ idCard, desc });

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
});
