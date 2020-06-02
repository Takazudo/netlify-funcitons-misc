const tall = require("tall").tall;

const raiseError = (message) => {
  console.error(message);
};

const unshortenUrl = async (url) => {
  const isYoutube = /youtube/.test(url);
  // I'm not sure but youtube always fails
  if(isYoutube) return url;

  try {
    return await tall(url);
  } catch (error) {
    throw new Error();
  }
};

exports.handler = async (event) => {
  // check method
  if (event.httpMethod !== "GET") {
    raiseError("ERR: method is not post");
    return {
      statusCode: 400,
      body: "Must POST to this function",
    };
  }

  const { url } = event.queryStringParameters;

  // check params
  if (!url) {
    raiseError("ERR: params not enough: url");
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

  try {
    const result = await unshortenUrl(url);
    return {
      statusCode: 200,
      'Content-Type': 'application/json; charset=UTF-8',
      body: JSON.stringify({
        original: url,
        result
      })
    };
  } catch (err) {
    raiseError(`ERR: fetching page failed. ${url}`);
    console.error(err);
    return {
      statusCode: 500,
      body: "failed",
    };
  }
};