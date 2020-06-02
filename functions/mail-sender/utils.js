require("dotenv").config();
const { URLSearchParams } = require("url");
const fetch = require("node-fetch");
const parseHtml = require("node-html-parser").parse;
const frontMatter = require("front-matter");
const tall = require("tall").tall;

const {
  TRELLO_API_KEY: key,
  TRELLO_API_TOKEN: token,
  TRELLO_LIST_ID_NEW_CARD_TO_BE_APPENDED: listIdTweet,
  TRELLO_LIST_ID_IOS: listIdIos,
  TWEET_TO_TRELLO_SECRET: correctAppSecret,
} = process.env;

module.exports.unshortenUrl = async (url) => {
  if(/youtube/.test(url)) return url
  try {
    const unshortenUrl = await tall(url);
    console.log("Tall url", unshortenUrl);
    if(/youtube/.test(url)) return url
    return unshortenUrl
  } catch (error) {
    console.log("GOT ERROR!", error);
  }
};

module.exports.isValidSecret = (appSecret) => {
  if (appSecret !== correctAppSecret) return false;
  return true;
};

module.exports.createDataFromJSON = (bodyContent) => {
  const parsed = JSON.parse(bodyContent);
  return {
    tweetText: null,
    urlSource: parsed.url,
    appSecret: parsed.secret,
  };
};

// ___LINE1___url: {{LinkURL}}___LINE2___secret: TAKAZUDOOWNS___LINE3___{{Text}}
module.exports.createDataFromBodyText = (bodyContent) => {
  const a = bodyContent.split("___LINE___");
  const str = `---
${a[0]}
${a[1]}
---
${a[2]}`;
  const data = frontMatter(str);
  return {
    tweetText: data.body,
    urlSource: data.attributes.url,
    appSecret: data.attributes.secret,
  };
};

module.exports.createParams = ({ desc, urlSource, fromTweet, fromIos }) => {
  const params = new URLSearchParams();
  const listId = fromTweet ? listIdTweet : listIdIos;
  params.append("pos", "top");
  params.append("idList", listId);
  params.append("key", key);
  params.append("token", token);
  if(desc) params.append("desc", desc);
  params.append("urlSource", urlSource);
  return params;
};

module.exports.fetchHtml = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    return false;
  }
  const data = await response.text();
  return data;
};

module.exports.createFormattedTextFromHtml = (html) => {
  const options = {
    script: false,
    style: false,
    pre: true,
    comment: false,
  };
  // parsed should be a formatted DOM element that node-html-parser generates
  const parsed = parseHtml(html, options);
  // we don't need many line breaks
  return parsed.text.replace(/\n\s+/g, "\n").replace(/\n\n\n+/g, "\n\n");
};

module.exports.combineText = (tweetText, pageText) => {
  let text;
  if (tweetText) {
    text = `${tweetText}\n\n---\n\n${pageText}`;
  } else {
    text = pageText;
  }
  return text.slice(0, 16384);
};

module.exports.createTrelloCard = async (params) => {
  //console.log(params)
  const response = await fetch("https://api.trello.com/1/cards", {
    method: "post",
    headers: { Accept: "application/json" },
    body: params,
  });
  return response;
};

module.exports.fetchCard = async (cardId) => {
  const params = new URLSearchParams();
  params.append("key", process.env.TRELLO_API_KEY);
  params.append("token", process.env.TRELLO_API_TOKEN);
  params.append("attachments", "true");

  const response = await fetch(`https://api.trello.com/1/card/${cardId}?${params}`, {
    method: "get",
    headers: { Accept: "application/json" }
  });
  return response;
}

module.exports.updateCardDesc = async (cardId, desc) => {
  const params = new URLSearchParams();
  params.append("key", process.env.TRELLO_API_KEY);
  params.append("token", process.env.TRELLO_API_TOKEN);
  params.append("desc", desc);

  const response = await fetch(`https://api.trello.com/1/cards/${cardId}`, {
    method: "put",
    headers: { Accept: "application/json" },
    body: params
  });
  return response;
}

module.exports.addUrlAttachment = async (cardId, url) => {
  const params = new URLSearchParams();
  params.append("key", process.env.TRELLO_API_KEY);
  params.append("token", process.env.TRELLO_API_TOKEN);
  params.append("url", url);

  const response = await fetch(`https://api.trello.com/1/cards/${cardId}/attachments`, {
    method: "post",
    headers: { Accept: "application/json" },
    body: params
  });
  return response;
}

module.exports.sendFetchPageTextRequest = async (cardId, path) => {
  const url = `${process.env.URL}${path}`;
  console.log("sending fetchPageText request to:", url);
  return fetch(url, {
    method: "post",
    headers: {
      "x-strategy": "fetchPageText",
      Accept: "application/json",
    },
    body: JSON.stringify({
      secret: process.env.TWEET_TO_TRELLO_SECRET,
      cardId,
    }),
  });
};

module.exports.sendExpandUrlRequest = async (cardId, path) => {
  const url = `${process.env.URL}${path}`;
  console.log("sending expandUrl request to:", url);
  return fetch(url, {
    method: "post",
    headers: {
      "x-strategy": "expandUrl",
      Accept: "application/json",
    },
    body: JSON.stringify({
      secret: process.env.TWEET_TO_TRELLO_SECRET,
      cardId,
    }),
  });
};
