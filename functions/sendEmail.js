import nodemailer from "nodemailer";
import { signUpEmail } from "./signUpEmail.js";
import { paymentConfirmationEmail } from "./paymentConfirmationEmai.js";

const mailConfig = nodemailer.createTransport({
  //service: "Hotmail",
  service: "gmail",
  auth: {
    user: "rentmeechlistings@gmail.com",
    pass: "tzis fbjm vdyt zdpx",
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
      name: "Rentmeech",
      address: "Rentmeech",
    },
    to: email,
    subject:
      emailType === 1
        ? "Welcome to RentMeech! Your Journey Starts Here"
        : "Great News! Your RentMeech Payment Was Successful",

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
