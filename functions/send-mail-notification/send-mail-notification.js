const nodemailer = require("nodemailer");
const {
  wait,
  initSentry,
  catchErrors,
  commonErrorResponse,
  commonSuccessResponse,
  isValidUser,
  reportError,
} = require("../utils");

exports.handler = catchErrors(async (event) => {
  initSentry();

  // check secret
  if (!isValidUser(event)) return commonErrorResponse;

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
        reportError(error);
      } else {
        console.log("mail sent seems ok");
      }
    }
  );

  // we need a tiny delay to ensure the mail was sent
  await wait(1000);

  return commonSuccessResponse;
});
