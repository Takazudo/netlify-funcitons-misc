const fetch = require("node-fetch");
const parseHtml = require("node-html-parser").parse;
//const fn1 = require("../tweet-to-trello/test.js").fn1;

const raiseError = (message) => {
  console.error(message);
};

const convertHtmlToText = (html) => {
  const options = {
    script: false,
    style: false,
    pre: true,
    comment: false,
  };
  // parsed should be a formatted DOM element that node-html-parser generates
  const parsed = parseHtml(html, options);
  // we don't need many line breaks
  return parsed.text.replace(/\n\s+/g, "\n").replace(/\n\n\n+/g, "\n\n");
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
    const response = await fetch(url);
    if (!response.ok) {
      return {
        statusCode: 400,
        body: "page fetching failed",
      };
    }
    const html = await response.text();
    const text = convertHtmlToText(html);
    return {
      statusCode: 200,
      'Content-Type': 'application/json; charset=UTF-8',
      body: JSON.stringify({
        //asdf: fn1(),
        text: text.trim(),
      }),
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
