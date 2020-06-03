const fetch = require("node-fetch");

const URL = {
  CREATE_CARD: `${process.env.URL}/.netlify/functions/trello-create-bookmark-card`,
  UPDATE_CARD_DESC: `${process.env.URL}/.netlify/functions/update-trello-card-desc`,
  UPDATE_ATTACHED_URL: `${process.env.URL}/.netlify/functions/update-trello-card-attached-url`,
};

const raiseError = (message) => {
  console.error(message);
};

const sendCardCreationRequest = async (event) => {
  const { url, targetList } = JSON.parse(event.body);
  const response = await fetch(URL.CREATE_CARD, {
    method: "post",
    headers: {
      "x-appsecret": event.headers["x-appsecret"],
      Accept: "application/json",
    },
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

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    raiseError("ERR: method is not post");
    return {
      statusCode: 400,
      body: "Must POST to this function",
    };
  }

  const cardData = await sendCardCreationRequest(event);

  console.log(cardData);

  return {
    statusCode: 400,
    body: JSON.stringify(cardData),
  };
};
