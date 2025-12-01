import nodemailer from "nodemailer";
import { signUpEmail } from "./signUpEmail.js";
import { paymentConfirmationEmail } from "./paymentConfirmationEmai.js";

const mailConfig = nodemailer.createTransport({
  //service: "Hotmail",
  service: "gmail",
  auth: {
    user: "heimishhub@gmail.com",
    pass: "jmqy wbon ikwp bogd",
  },
});

export default async function ({
  email,
  name,
  emailType,
  amount,
  transactionId,
}) {
  const mailOptions = {
    from: {
      name: "HeimishHub",
      address: "HeimishHub",
    },
    to: email,
    subject: emailType === 1
    ? "Welcome to HeimishHub! Your Journey Starts Here"
    : "Great News! Your HeimishHub Payment Was Successful",

    
    html:
      emailType === 1
        ? signUpEmail(name)
        : paymentConfirmationEmail({
            userName: name,
            paymentAmount: amount,
            transactionId,
          }),
  };
  try {
    await mailConfig.sendMail(mailOptions);
    return "200";
  } catch (e) {
    console.log(e);
    return e;
  }
}
