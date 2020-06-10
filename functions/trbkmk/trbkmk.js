const fetch = require("node-fetch");

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
    CREATE_CARD: `${baseUrl}/trello-create-bookmark-card`,
    UPDATE_CARD_DESC: `${baseUrl}/trbkmk-steps-update-card-desc`,
    EXPAND_ATTACHED_URL: `${baseUrl}/trbkmk-steps-expand-attached-url`,
  };

  const commonRequestHeaders = {
    "x-appsecret": event.headers["x-appsecret"],
    Accept: "application/json",
  };
  if (event.headers["x-debug-env-url"]) {
    commonRequestHeaders["x-debug-env-url"] = envUrl;
  }

  const sendCardCreationRequest = async (url, targetList) => {
    const response = await fetch(URL.CREATE_CARD, {
      method: "post",
      headers: commonRequestHeaders,
      body: JSON.stringify({ url, targetList }),
    });
    if (!response.ok) {
      raiseError(`error on card creation`);
      return {
        statusCode: response.status,
        body: response.statusText,
      };
    }
    return await response.json();
  };

  const updateCardDesc = async (idCard) => {
    // TODO: handle error
    //console.log(`idCard: ${idCard}`);
    const response = await fetch(URL.UPDATE_CARD_DESC, {
      method: "post",
      headers: commonRequestHeaders,
      body: JSON.stringify({ idCard }),
    });
    return response.json();
  };

  const expandAttachedUrl = async (idCard, url) => {
    // TODO: handle error
    //console.log(`idCard: ${idCard}`);
    const response = await fetch(URL.EXPAND_ATTACHED_URL, {
      method: "post",
      headers: commonRequestHeaders,
      body: JSON.stringify({ idCard, url }),
    });
    return response.json();
  };

  const { url, targetList } = JSON.parse(event.body);
  const { cardData } = await sendCardCreationRequest(url, targetList);
  const idCard = cardData.id;
  updateCardDesc(idCard);
  expandAttachedUrl(idCard, url);
  return {
    statusCode: 400,
    body: JSON.stringify({
      result: true,
    }),
  };
};
