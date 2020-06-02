const {
  createParams,
  createTrelloCard,
  isValidSecret,
  createDataFromBodyText,
  createDataFromJSON,
} = require("./utils");

const { notifyFailure } = require("./mail-sender");

const raiseError = (message) => {
  console.log(message);
  notifyFailure(message);
};

module.exports = async ({ event }) => {
  const bodyFormat = event.headers["x-bodyformat"] || "TEXT";
  //const isExtraRequest = (event.headers['x-extrarequest'] === '1') ? true : false
  const converter =
    bodyFormat === "JSON" ? createDataFromJSON : createDataFromBodyText;
  //console.log('body is...')
  //console.log(event.body)
  const { tweetText, urlSource, appSecret } = converter(event.body);

  // check params
  if (!urlSource || !appSecret) {
    raiseError("ERR: params not enough");
    return {
      statusCode: 400,
      body: "params not enough",
    };
  }

  // need valid appSecret
  if (!isValidSecret(appSecret)) {
    raiseError("ERR: invalid appSecret");
    return {
      statusCode: 400,
      body: "invalid appSecret",
    };
  }

  // == fetch formatted page text ==

  try {
    // post to trello
    const params = createParams({
      desc: tweetText,
      fromTweet: bodyFormat === "TEXT",
      fromIos: bodyFormat === "JSON",
      urlSource: urlSource,
    });
    const response = await createTrelloCard(params);

    // something wrong
    if (!response.ok) {
      raiseError(`ERR: trello api says response.ok is false ${urlSource}`);
      //console.log(data)
      return {
        statusCode: response.status,
        body: response.statusText,
      };
    }

    const data = await response.json();
    //console.log('=======')
    //console.log(data.id)
    //if(!isExtraRequest) sendExtraRequest()

    // succeeded!
    return {
      cardId: data.id,
      cardName: data.name
    };
  } catch (err) {
    // something wrong
    raiseError(`ERR: request failed on creating card ${urlSource}`);
    console.log(err.message);
    console.log(err);
    return null;
  }
};
