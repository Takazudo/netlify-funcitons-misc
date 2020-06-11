const fetch = require("node-fetch");

// expected format is like below
// "{{secret}}___SEPARATOR___{{Text}}___SEPARATOR___{{LinkURL}}"
const extractDataFromBody = (requestBody) => {
  const SEPARATOR = "___SEPARATOR___";
  const array = requestBody.split(SEPARATOR);
  console.log(array);
  return {
    appSecret: array[0],
    tweetText: array[1],
    tweetUrl: array[2],
  };
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 400,
      body: "Must POST to this function",
    };
  }

  const envUrl = event.headers["x-debug-env-url"] || process.env.URL;
  let baseUrl = `${envUrl}/.netlify/functions`;

  const URL = {
    TRBKMK: `${baseUrl}/trbkmk`,
  };

  const { appSecret, tweetText, tweetUrl } = extractDataFromBody(event.body);

  const commonRequestHeaders = {
    "x-appsecret": appSecret,
    Accept: "application/json",
  };
  if (event.headers["x-debug-env-url"]) {
    commonRequestHeaders["x-debug-env-url"] = envUrl;
  }

  const response = await fetch(URL.TRBKMK, {
    method: "post",
    headers: commonRequestHeaders,
    body: JSON.stringify({
      url: tweetUrl,
      desc: tweetText,
      targetList: "TWEET",
    }),
  });
  const result = await response.json();

  return {
    statusCode: 400,
    body: JSON.stringify(result),
  };
};
