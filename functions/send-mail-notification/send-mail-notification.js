const nodemailer = require("nodemailer");
const { wait, initSentry, catchErrors } = require("../utils");

exports.handler = catchErrors(async (event) => {
  initSentry();

  // check method
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 400,
      body: "Must POST to this function",
    };
  }

  // check secret
  const appSecret = event.headers["x-appsecret"];
  if (appSecret !== process.env.APP_SECRET) {
    return {
      statusCode: 400,
      body: "appSecret invalid",
    };
  }

  const body = JSON.parse(event.body);

  // send mail
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_SENDER_ADDRESS,
      pass: process.env.GMAIL_SENDER_PASSWORD,
    },
  });

  transporter.sendMail(
    {
      from: `"TRBKMK" <${process.env.GMAIL_SENDER_ADDRESS}>`,
      to: process.env.MAIL_RECEIVER_ADDRESS,
      subject: body.subject,
      text: body.text,
    },
    function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("mail sent seems ok");
      }
    }
  );

  await wait(1000);

  return {
    statusCode: 200,
    body: JSON.stringify({ result: true }),
  };
});
