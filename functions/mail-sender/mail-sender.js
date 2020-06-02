const nodemailer = require("nodemailer");

const raiseError = (message) => {
  console.error(message);
};

exports.handler = (event, context) => {
  // check method
  if (event.httpMethod !== "POST") {
    raiseError("ERR: method is not post");
    return {
      statusCode: 400,
      body: "Must POST to this function",
    }
  }

  const body = JSON.parse(event.body);

  // check secret
  if(body.appSecret !== process.env.APP_SECRET) {
    raiseError("ERR: appSecret invalid");
    return {
      statusCode: 400,
      body: "appSecret invalid",
    }
  }

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
      from: `"TrBkmk" <${process.env.GMAIL_SENDER_ADDRESS}>`,
      to: process.env.GMAIL_SENDER_ADDRESS,
      subject: body.subject,
      text: body.text,
    },
    function (error, info) {
      if (error) {
        raiseError("ERR: mail sent falled");
        console.log(error);
      } else {
        console.log("mail sent seems ok");
      }
    }
  );

  return {
    statusCode: 200,
    body: "mail sent",
  }
};

