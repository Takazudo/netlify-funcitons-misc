const {
  fetchHtml,
  createFormattedTextFromHtml,
  combineText,
  isValidSecret,
  fetchCard,
  updateCardDesc,
} = require("./utils");

const { notifyFailure } = require("./mail-sender");

const raiseError = (message) => {
  console.log(message);
  notifyFailure(message);
};

module.exports = async ({ event }) => {
  const parsed = JSON.parse(event.body);

  // export post values

  const { secret, cardId } = parsed;

  // check params

  if (!cardId) {
    raiseError("ERR: params not enough: cardId (fetchPageText)");
    return;
  }
  if (!secret) {
    raiseError("ERR: params not enough: secret (fetchPageText)");
    return;
  }

  // confirm appSecret

  if (!isValidSecret(secret)) {
    raiseError("ERR: invalid appSecret");
    return;
  }

  // get desc from card

  const resp = await fetchCard(cardId);
  const data = await resp.json();
  const desc = data.desc;
  const url = data.attachments[0].url;

  // fetch page text

  let formattedPageText;

  try {
    // fetch target page's html as text
    const html = await fetchHtml(url);
    formattedPageText = createFormattedTextFromHtml(html);
  } catch (err) {
    raiseError(`ERR: fetching page failed. ${url}`);
    console.log(err);
    return {
      statusCode: 500,
      body: "failed",
    };
  }

  const updartedDesc = combineText(desc, formattedPageText);

  try {
    await updateCardDesc(cardId, updartedDesc);
  } catch (err) {
    raiseError(`ERR: udpate card failed. ${url}`);
    console.log(err);
    return {
      statusCode: 500,
      body: "failed",
    };
  }
};
