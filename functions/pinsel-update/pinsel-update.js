const fetch = require("node-fetch");
const { PINSEL_SLACK_WEBHOOK } = process.env;
const { initSentry, catchErrors, commonErrorResponse } = require("../utils");

exports.handler = catchErrors(async (event) => {
  initSentry();

  const postToSlack = async () => {
    console.log(PINSEL_SLACK_WEBHOOK);
    const response = await fetch(PINSEL_SLACK_WEBHOOK, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Received Payment!" }),
    });
    return await response;
  };

  // else attach new url
  try {
    await postToSlack();
  } catch (e) {
    console.log(e);
    return commonErrorResponse;
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      result: true,
      attached: true,
    }),
  };
});
