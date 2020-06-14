const fetch = require("node-fetch");
const {
  wait,
  initSentry,
  catchErrors,
  createBaseUrl,
  commonSuccessResponse,
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
    createCard: `${baseUrl}/trello-create-bookmark-card`,
    updateCardDesc: `${baseUrl}/trbkmk-steps-update-card-desc`,
    expandAttachedUrl: `${baseUrl}/trbkmk-steps-expand-attached-url`,
    sendMail: `${baseUrl}/send-mail-notification`,
  };

  const headers = createCommonRequestHeaders(event);

  const sendCardCreationRequest = async (url, targetList, desc) => {
    const requestBody = { url, targetList };
    if (desc) {
      requestBody.desc = desc;
    }
    const response = await fetch(api.createCard, {
      method: "post",
      headers,
      body: JSON.stringify(requestBody),
    });
    return await response.json();
  };

  const updateCardDesc = async (idCard) => {
    //console.log(`idCard: ${idCard}`);
    const response = await fetch(api.updateCardDesc, {
      method: "post",
      headers,
      body: JSON.stringify({ idCard }),
    });
    return await response.json();
  };

  const expandAttachedUrl = async (idCard, url) => {
    //console.log(`idCard: ${idCard}`);
    const response = await fetch(api.expandAttachedUrl, {
      method: "post",
      headers,
      body: JSON.stringify({ idCard, url }),
    });
    return await response.json();
  };

  const sendMail = async (cardName, url) => {
    const response = await fetch(api.sendMail, {
      method: "post",
      headers,
      body: JSON.stringify({
        subject: `⭐️ ${cardName}`,
        text: url,
      }),
    });
    return await response.json();
  };

  const { url, targetList, desc } = JSON.parse(event.body);
  const { cardData } = await sendCardCreationRequest(url, targetList, desc);
  const idCard = cardData.id;

  // notify that we made a card via mail
  sendMail(cardData.name, url);

  // invoke extras
  updateCardDesc(idCard);
  expandAttachedUrl(idCard, url);

  // we need a tiny delay to invoke above extras
  await wait(2000);

  return commonSuccessResponse;
});
