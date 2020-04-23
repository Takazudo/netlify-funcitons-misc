const {
  createParams,
  fetchHtml,
  createFormattedTextFromHtml,
  combineText,
  createTrelloCard,
  isValidSecret,
  createDataFromBodyText,
  createDataFromJSON,
  unshortenUrl
} = require('./utils')

const {
  notifyFailure
} = require('./mail-sender')

const raiseError = message => {
  console.log(message)
  notifyFailure(message)
}

exports.handler = async (event, context) => {
  console.log('=== request accepted ===')

  if (event.httpMethod !== 'POST') {
    raiseError('ERR: method is not post')
    return {
      statusCode: 400,
      body: 'Must POST to this function'
    }
  }

  const bodyFormat = event.headers['x-bodyformat'] || 'TEXT'
  const converter = bodyFormat === 'JSON' ? createDataFromJSON : createDataFromBodyText
  const { tweetText, urlSource, appSecret } = converter(event.body)

  // check params
  if (!urlSource || !appSecret) {
    raiseError('ERR: params not enough')
    return {
      statusCode: 400,
      body: 'params not enough'
    }
  }

  // need valid appSecret
  if (!isValidSecret(appSecret)) {
    raiseError('ERR: invalid appSecret')
    return {
      statusCode: 400,
      body: 'invalid appSecret'
    }
  }

  // == expand url ==

  let expandedUrl

  try {
    let gotResult = false
    setTimeout(() => {
      if(gotResult) return
      throw new Error('oops')
    }, 5000)
    expandedUrl = await unshortenUrl(urlSource)
    gotResult = true
  } catch (error) {
    raiseError('ERR: tall failed. Anyway keep going.')
    expandedUrl = urlSource
  }

  // == fetch formatted page text ==

  let formattedPageText

  try {
    // fetch target page's html as text
    const html = await fetchHtml(expandedUrl)
    formattedPageText = createFormattedTextFromHtml(html)
  } catch (err) {
    raiseError(`ERR: fetching page failed. ${expandedUrl}`)
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
      fromTweet: bodyFormat === 'TEXT',
      fromIos: bodyFormat === 'JSON',
      urlSource: expandedUrl
    })
    const response = await createTrelloCard(params)

    // something wrong
    if (!response.ok) {
      raiseError(`ERR: trello api says response.ok is false ${expandedUrl}`)
      // NOT res.status >= 200 && res.status < 300
      const data = await response.json()
      console.log(data)
      return {
        statusCode: response.status,
        body: response.statusText
      }
    }

    // const data = await response.json()

    console.log('DONE: succeeded')
    // succeeded!
    return {
      statusCode: 200,
      body: ''
      // body: JSON.stringify(data)
    }
  } catch (err) {
    // something wrong
    raiseError(`ERR: request failed on creating card ${expandedUrl}`)
    console.log(err.message)
    console.log(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }) // Could be a custom message or object i.e. JSON.stringify(err)
    }
  }
}
