const fetch = require('node-fetch')

const {
  createParams,
  fetchHtml,
  createFormattedTextFromHtml,
  combineText,
  createTrelloCard,
  isValidSecret,
  createDataFromRequestBody
} = require('./utils')

exports.handler = async (event, context) => {

  console.log('=== request accepted ===')

  if (event.httpMethod !== 'POST'){
    console.log('ERR: method is not post')
    return {
      statusCode: 400,
      body: 'Must POST to this function'
    }
  }

  const { tweetText, urlSource, appSecret } = createDataFromRequestBody(event.body)

  // check params
  if(!tweetText || !urlSource || !appSecret) {
    console.log('ERR: params not enough')
    return {
      statusCode: 400,
      body: 'params not enough'
    }
  }

  // need valid appSecret
  if(!isValidSecret(appSecret)) {
    console.log('ERR: invalid appSecret')
    return {
      statusCode: 400,
      body: 'invalid appSecret'
    }
  }

  let formattedPageText;

  try {
    // fetch target page's html as text
    const html = await fetchHtml(urlSource)
    formattedPageText = createFormattedTextFromHtml(html)

  } catch (err) {
    console.log('ERR: fetching page failed')
    console.log(err)
    // something wrong
    return {
      statusCode: 500,
      body: ''
    }
  }

  try {
    // post to trello
    const params = createParams({
      desc: combineText(tweetText, formattedPageText),
      urlSource
    })
    const response = await createTrelloCard(params)

    // something wrong
    if (!response.ok) {
      console.log('ERR: trello api says response.ok is false')
      // NOT res.status >= 200 && res.status < 300
      const data = await response.json()
      return {
        statusCode: response.status,
        body: response.statusText
      }
    }

    const data = await response.json()

    console.log('DONE: succeeded')
    // succeeded!
    return {
      statusCode: 200,
      body: '' //JSON.stringify(data)
    }
  } catch (err) {
    // something wrong
    console.log('ERR: request failed on creating card')
    console.log(err.message)
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }) // Could be a custom message or object i.e. JSON.stringify(err)
    }
  }

}
