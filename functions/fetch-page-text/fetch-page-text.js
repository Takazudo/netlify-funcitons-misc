const fetch = require("node-fetch");
const parseHtml = require("node-html-parser").parse;
const {
  initSentry,
  catchErrors,
  isValidUser,
  commonErrorResponse,
  reportError,
} = require("../utils");

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

exports.handler = catchErrors(async (event) => {
  initSentry();

  const { url } = event.queryStringParameters;

  // check params
  if (!url) {
    reportError(new Error("param missing: url"));
    return commonErrorResponse;
  }

  // check secret
  if (!isValidUser(event)) return commonErrorResponse;

  const response = await fetch(url);
  const html = await response.text();
  const text = convertHtmlToText(html);

  return {
    statusCode: 200,
    "Content-Type": "application/json; charset=UTF-8",
    body: JSON.stringify({
      text: text.trim(),
    }),
  };
});
