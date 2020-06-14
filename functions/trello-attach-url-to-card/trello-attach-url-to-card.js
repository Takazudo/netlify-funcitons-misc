const fetch = require("node-fetch");
const {
  initSentry,
  catchErrors,
  commonSuccessResponse,
  commonErrorResponse,
  isValidUser,
} = require("../utils");

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

exports.handler = catchErrors(async (event) => {
  initSentry();

  // check secret
  if (!isValidUser(event)) return commonErrorResponse;

  const { url, idCard } = JSON.parse(event.body);

  // check params
  if (!url) {
    reportError(new Error("param missing: url"));
    return commonErrorResponse;
  }
  if (!idCard) {
    reportError(new Error("param missing: idCard"));
    return commonErrorResponse;
  }

  const params = createParams(url);
  await attachUrlToCard(params, idCard);

  return commonSuccessResponse;
});
