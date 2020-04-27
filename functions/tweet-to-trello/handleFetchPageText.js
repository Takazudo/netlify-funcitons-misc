const {
  createParams,
  fetchHtml,
  createFormattedTextFromHtml,
  combineText,
  createTrelloCard,
  isValidSecret,
  createDataFromBodyText,
  createDataFromJSON,
  unshortenUrl,
  fetchCard,
  updateCardDesc
} = require('./utils')

const {
  notifyFailure
} = require('./mail-sender')

const raiseError = message => {
  console.log(message)
  notifyFailure(message)
}

module.exports = async ({event}) => {

  const parsed = JSON.parse(event.body)

  // export post values

  const { secret, cardId } = parsed

  // check params

  if (!cardId || !secret) {
    raiseError('ERR: params not enough')
    return
  }

  // confirm appSecret

  if (!isValidSecret(secret)) {
    raiseError('ERR: invalid appSecret')
    return
  }

  // get desc from card

  const resp = await fetchCard(cardId)
  const data = await resp.json()
  const desc = data.desc
  const url = data.attachments[0].url

  // fetch page text

  let formattedPageText

  try {
    // fetch target page's html as text
    const html = await fetchHtml(url)
    formattedPageText = createFormattedTextFromHtml(html)
  } catch (err) {
    raiseError(`ERR: fetching page failed. ${url}`)
    console.log(err)
    return {
      statusCode: 500,
      body: 'failed'
    }
  }

  const updartedDesc = combineText(desc, formattedPageText)

  try {
    const resp = await updateCardDesc(cardId, updartedDesc)
    const data = await resp.json()
  } catch (err) {
    raiseError(`ERR: udpate card failed. ${url}`)
    console.log(err)
    return {
      statusCode: 500,
      body: 'failed'
    }
  }

  return {
    statusCode: 200,
    body: 'done'
  }

}