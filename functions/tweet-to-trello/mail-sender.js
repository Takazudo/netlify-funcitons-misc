require("dotenv").config();
const nodemailer = require("nodemailer");

module.exports.notifyFailure = (message) => {
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
      to: process.env.ERROR_REPORT_TO,
      subject: `[TrBkmk] Failed: ${message}`,
      text: message,
    },
    function (error, info) {
      if (error) {
        console.log("ERR: mail sent falled");
        console.log(error);
      } else {
        console.log("mail sent seems ok");
      }
    }
  );
};
