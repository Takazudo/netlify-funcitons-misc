const fetch = require("node-fetch");
const { initSentry, catchErrors } = require("../utils");

// Trello card's desc can contain 16384 chars
const DESC_LIMIT_TEXT_LENGTH = 16384;

const raiseError = (message) => {
  console.error(message);
};

const createNewDesc = (prevDesc, pageText) => {
  let newDesc;
  if (prevDesc) {
    newDesc = `${prevDesc}\n\n---\n\n${pageText}`;
  } else {
    newDesc = pageText;
  }
  return newDesc.slice(0, DESC_LIMIT_TEXT_LENGTH);
};

exports.handler = catchErrors(async (event) => {
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
    FETCH_CARD: `${baseUrl}/trello-fetch-card`,
    FETCH_PAGE_TEXT: `${baseUrl}/fetch-page-text`,
    UPDATE_DESC: `${baseUrl}/trello-update-card-desc`,
  };

  // check secret
  const appSecret = event.headers["x-appsecret"];
  if (appSecret !== process.env.APP_SECRET) {
    raiseError("ERR: appSecret invalid");
    return {
      statusCode: 400,
      body: "appSecret invalid",
    };
  }

  const commonRequestHeaders = {
    "x-appsecret": event.headers["x-appsecret"],
    Accept: "application/json",
  };

  const fetchCard = async (idCard) => {
    // TODO: handle error
    const url = `${URL.FETCH_CARD}?idCard=${idCard}`;
    //console.log(url);
    const response = await fetch(url, {
      method: "get",
      headers: commonRequestHeaders,
    });
    return await response.json();
  };

  const fetchPageText = async (targetUrl) => {
    // TODO: handle error
    const url = `${URL.FETCH_PAGE_TEXT}?url=${targetUrl}`;
    //console.log(url);
    const response = await fetch(url, {
      method: "get",
      headers: commonRequestHeaders,
    });
    return (await response.json()).text;
  };

  const updateCardDesc = async (idCard, desc) => {
    // TODO: handle error
    //console.log(url);
    const response = await fetch(URL.UPDATE_DESC, {
      method: "put",
      headers: commonRequestHeaders,
      body: JSON.stringify({ idCard, desc }),
    });
    return response.json();
  };

  const { idCard } = JSON.parse(event.body);
  // TODO: handle error
  const cardData = await fetchCard(idCard);

  const desc = cardData.desc;
  //console.log('==== cardData ====');
  //console.log(cardData);

  // Note: posted urlSource was handled as attachment before.
  // but now trello API handles it as card name.
  //const url = cardData.attachments[0].url;
  const url = cardData.name;

  //console.log('==== desc ====');
  //console.log(desc);
  //console.log('==== url ====');
  //console.log(url);

  // TODO: handle error
  const pageText = await fetchPageText(url);

  const newDesc = createNewDesc(desc, pageText);
  // TODO: handle error
  const updatedCardData = await updateCardDesc(idCard, newDesc);

  return {
    statusCode: 400,
    body: JSON.stringify(updatedCardData),
  };
});
