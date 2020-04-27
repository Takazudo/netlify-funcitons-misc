const {
  isValidSecret,
  unshortenUrl,
  fetchCard,
  addUrlAttachment,
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
    raiseError("ERR: params not enough: cardId (exapndUrl)");
    return;
  }
  if (!secret) {
    raiseError("ERR: params not enough: secret (expandUrl)");
    return;
  }

  // confirm appSecret

  if (!isValidSecret(secret)) {
    raiseError("ERR: invalid appSecret");
    return;
  }

  // get url from card

  const resp = await fetchCard(cardId);
  const data = await resp.json();
  const url = data.attachments[0].url;

  // get expanded url

  let expandedUrl;

  try {
    expandedUrl = await unshortenUrl(url);
  } catch (error) {
    raiseError("ERR: tall failed. Anyway keep going.");
    expandedUrl = url;
  }

  // add expanded url

  if (url === expandedUrl) return;

  try {
    await addUrlAttachment(cardId, expandedUrl);
  } catch (err) {
    raiseError(`ERR: udpate card failed. ${url}`);
    console.log(err);
    return {
      statusCode: 500,
      body: "failed",
    };
  }
};
