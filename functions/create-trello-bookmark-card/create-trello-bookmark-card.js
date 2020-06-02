const raiseError = (message) => {
  console.error(message);
};

exports.handler = (event) => {
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

  const { url } = JSON.parse(event.body);

  // check params
  if (!url) {
    raiseError("ERR: params not enough: url");
    return;
  }

  return {
    statusCode: 200,
    body: "OK boy",
  };
};
