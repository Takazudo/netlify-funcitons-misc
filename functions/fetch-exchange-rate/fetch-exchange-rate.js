const fetch = require("node-fetch");
const {
  initSentry,
  catchErrors,
  commonErrorResponse,
  reportError,
} = require("../utils");

exports.handler = catchErrors(async (event) => {
  initSentry();

  const { base } = event.queryStringParameters;

  // check params
  if (!base) {
    reportError(new Error("param missing: base"));
    return commonErrorResponse;
  }

  const url = new URL("https://api.exchangeratesapi.io/latest");
  const params = {
    base: base,
  };
  url.search = new URLSearchParams(params).toString();

  const response = await fetch(url);
  const json = await response.json();
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };
  return {
    statusCode: response.status,
    headers,
    "Content-Type": "application/json; charset=UTF-8",
    body: JSON.stringify(json),
  };
});
