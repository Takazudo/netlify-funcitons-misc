const fetch = require("node-fetch");

// Trello card's desc can contain 16384 chars
const DESC_LIMIT_TEXT_LENGTH = 16384;

const raiseError = (message) => {
  console.error(message);
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    raiseError("ERR: method is not post");
    return {
      statusCode: 400,
      body: "Must POST to this function",
    };
  }
  const envUrl = event.headers["x-debug-env-url"] || process.env.URL;
  let baseUrl = `${envUrl}/.netlify/functions`;

  const URL = {
    UNSHORTEN_URL: `${baseUrl}/unshorten-url`,
    ATTACH_URL: `${baseUrl}/trello-attach-url-to-card`,
  };

  // check secret
  const appSecret = event.headers["x-appsecret"];
  if (appSecret !== process.env.APP_SECRET) {
    raiseError("ERR: appSecret invalid");
    return {
      statusCode: 400,
      body: "appSecret invalid",
    };
  }

  const commonRequestHeaders = {
    "x-appsecret": event.headers["x-appsecret"],
    Accept: "application/json",
  };

  const unshortenUrl = async (originalUrl) => {
    // TODO: handle error
    const url = `${URL.UNSHORTEN_URL}?url=${originalUrl}`;
    console.log(url);
    const response = await fetch(url, {
      method: "get",
      headers: commonRequestHeaders,
    });
    return await response.json();
  };

  const attachUrlToCard = async (idCard, url) => {
    // TODO: handle error
    console.log(url);
    const response = await fetch(URL.ATTACH_URL, {
      method: "post",
      headers: commonRequestHeaders,
      body: JSON.stringify({ idCard, url }),
    });
    return response.json();
  };

  const { idCard, url } = JSON.parse(event.body);

  // expand url
  const unshortenedUrl = (await unshortenUrl(url)).result;

  // if same, return
  if (url === unshortenedUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        result: true,
        attached: false,
      }),
    };
  }

  // else attach new url
  const updatedCardData = await attachUrlToCard(idCard, unshortenedUrl);

  return {
    statusCode: 400,
    body: JSON.stringify({
      result: true,
      attached: true,
    }),
  };
};
