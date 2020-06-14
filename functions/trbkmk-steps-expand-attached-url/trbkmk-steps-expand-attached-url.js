const fetch = require("node-fetch");
const {
  initSentry,
  catchErrors,
  createBaseUrl,
  createCommonRequestHeaders,
  commonErrorResponse,
  isValidUser,
} = require("../utils");

exports.handler = catchErrors(async (event) => {
  initSentry();

  // check secret
  if (!isValidUser(event)) return commonErrorResponse;

  const baseUrl = createBaseUrl(event);

  const api = {
    unshortenUrl: `${baseUrl}/unshorten-url`,
    attachUrl: `${baseUrl}/trello-attach-url-to-card`,
  };

  const headers = createCommonRequestHeaders(event);

  const unshortenUrl = async (originalUrl) => {
    const url = `${api.unshortenUrl}?url=${originalUrl}`;
    console.log(url);
    const response = await fetch(url, {
      method: "get",
      headers,
    });
    return await response.json();
  };

  const attachUrlToCard = async (idCard, url) => {
    const response = await fetch(api.attachUrl, {
      method: "post",
      headers,
      body: JSON.stringify({ idCard, url }),
    });
    return await response.json();
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
  try {
    await attachUrlToCard(idCard, unshortenedUrl);
  } catch (e) {
    return commonErrorResponse;
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      result: true,
      attached: true,
    }),
  };
});
