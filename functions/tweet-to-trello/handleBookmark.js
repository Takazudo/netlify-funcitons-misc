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

module.exports = async ({event}) => {

  const bodyFormat = event.headers['x-bodyformat'] || 'TEXT'
  //const isExtraRequest = (event.headers['x-extrarequest'] === '1') ? true : false
  const converter = bodyFormat === 'JSON' ? createDataFromJSON : createDataFromBodyText
  //console.log('body is...')
  //console.log(event.body)
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
      expandedUrl = urlSource
      throw new Error('oops tall timeout')
    }, 5000)
    expandedUrl = await unshortenUrl(urlSource)
    gotResult = true
  } catch (error) {
    raiseError('ERR: tall failed. Anyway keep going.')
    expandedUrl = urlSource
  }

  // == fetch formatted page text ==

  try {
    // post to trello
    const params = createParams({
      desc: tweetText,
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
      //console.log(data)
      return {
        statusCode: response.status,
        body: response.statusText
      }
    }

    const data = await response.json()
    //console.log('=======')
    //console.log(data.id)
    //if(!isExtraRequest) sendExtraRequest()

    console.log('DONE: succeeded')
    // succeeded!
    return {
      statusCode: 200,
      body: { cardId: data.id }
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