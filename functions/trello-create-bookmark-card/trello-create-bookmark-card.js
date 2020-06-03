const fetch = require("node-fetch");

const raiseError = (message) => {
  console.error(message);
};

const createParams = ({ url, idList }) => {
  const params = new URLSearchParams();
  const { TRELLO_API_KEY: key, TRELLO_API_TOKEN: token } = process.env;
  params.append("pos", "top");
  params.append("idList", idList);
  params.append("key", key);
  params.append("token", token);
  params.append("urlSource", url);
  return params;
};

const createCard = async (params) => {
  const response = await fetch("https://api.trello.com/1/cards", {
    method: "post",
    headers: { Accept: "application/json" },
    body: params,
  });
  return response;
};

// get targetList from env value.
// need to define list id in .env file.
const getTargetListId = (targetList) => {
  const idList = process.env[`TARGET_LIST_${targetList}`];
  if (!idList) {
    throw new Error(`targetList not defined: ${targetList}`);
  }
  return idList;
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

  const { url, targetList } = JSON.parse(event.body);

  // check params
  if (!url) {
    raiseError("ERR: params not enough: url");
    return;
  }

  const idList = getTargetListId(targetList || "DEFAULT");
  const params = createParams({ url, idList });
  const response = await createCard(params);

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
