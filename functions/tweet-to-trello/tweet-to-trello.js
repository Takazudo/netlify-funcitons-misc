const fetch = require('node-fetch')

const {
  createParams,
  fetchHtml,
  createFormattedTextFromHtml,
  combineText,
  createTrelloCard,
  isValidSecret
} = require('./utils')

exports.handler = async (event, context) => {

  if (event.httpMethod !== 'POST'){
    return {
      statusCode: 400,
      body: 'Must POST to this function'
    }
  }

  console.log('=== dumping for debug ===')
  const trimmedBody = event.body.replace(/\n+/g, ' ')
  const { tweetText, urlSource, appSecret } = JSON.parse(trimmedBody)

  // check params
  if(!tweetText || !urlSource || !appSecret) {
    return {
      statusCode: 400,
      body: 'params not enough'
    }
  }

  // need valid appSecret
  if(!isValidSecret(appSecret)) {
    return {
      statusCode: 400,
      body: 'invalid appSecret'
    }
  }

  try {
    // fetch target page's html as text
    const html = await fetchHtml(urlSource)
    const formattedPageText = createFormattedTextFromHtml(html)

    // post to trello
    const params = createParams({
      desc: combineText(tweetText, formattedPageText),
      urlSource
    })
    const response = await createTrelloCard(params)

    // something wrong
    if (!response.ok) {
      // NOT res.status >= 200 && res.status < 300
      const data = await response.json()
      return {
        statusCode: response.status,
        body: response.statusText
      }
    }

    const data = await response.json()
    console.log('=== dumping for debug ===')
    console.log(data)

    // succeeded!
    return {
      statusCode: 200,
      body: '' //JSON.stringify(data)
    }
  } catch (err) {
    // something wrong
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }) // Could be a custom message or object i.e. JSON.stringify(err)
    }
  }

}
