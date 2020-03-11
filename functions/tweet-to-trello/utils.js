require('dotenv').config()
const { URLSearchParams } = require('url');
const fetch = require('node-fetch')
const parseHtml = require('node-html-parser').parse

const {
  TRELLO_API_KEY: key,
  TRELLO_API_TOKEN: token,
  TRELLO_LIST_ID_NEW_CARD_TO_BE_APPENDED: list_id,
  TWEET_TO_TRELLO_SECRET: correctAppSecret
} = process.env

module.exports.isValidSecret = appSecret => {
  if(appSecret !== correctAppSecret) return false
  return true
}

module.exports.createParams = ({ desc, urlSource }) => {
  const params = new URLSearchParams();
  params.append('pos', 'top')
  params.append('idList', list_id)
  params.append('key', key)
  params.append('token', token)
  params.append('desc', desc)
  params.append('urlSource', urlSource)
  return params
}

module.exports.fetchHtml = async url => {
  const response = await fetch(url)
  if (!response.ok) {
    return false
  }
  const data = await response.text()
  return data
}

module.exports.createFormattedTextFromHtml = html => {
  const options = {
    script: false,
    style: false,
    pre: true,
    comment: false,
  }
  // parsed should be a formatted DOM element that node-html-parser generates
  const parsed = parseHtml(html, options)
  // we don't need many line breaks
  return parsed.text
    .replace(/\n\s+/g, '\n')
    .replace(/\n\n\n+/g, '\n\n')
}

module.exports.combineText = (tweetText, pageText) => {
  const text = `${tweetText}\n\n---\n\n${pageText}`
  return text.slice(0, 16384)
}

module.exports.createTrelloCard = async params => {
  return await fetch('https://api.trello.com/1/cards', {
    method: 'post',
    headers: { Accept: 'application/json' },
    body: params
  })
}
