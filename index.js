import express from "express";
import "dotenv/config";
import main from "./routes/main.js";
import payments from "./routes/payments.js";
import path from "path";
import fileUpload from "express-fileupload";
import cors from "cors";
import helmet from "helmet";
import error from "./routes/error.js";
import { fileURLToPath } from "url";
import sendEmail from "./functions/sendEmail.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(
  cors({
    allowedHeaders: [
      "sessionId",
      "Content-Type",
      "x-auth-token",
      "authorization",
    ],
    exposedHeaders: ["sessionId"],
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
  })
);
app.use(express.json());
app.use(fileUpload());

app.use("/short_rental", main);
app.use("/upload", express.static("./upload"));
app.use("/api", payments);
app.get("/sendemail", async (req, res) => {
  res.send(
    await sendEmail({
      name: "yechiel",
      emailType: 2,
      amount: 40,
      email: "yechiel1253@gmail.com",
      transactionId: "123465657",
    })
  );
});
app.use(error);
console.log(process.env.KEY_FOR_TEST);

const PORT = 5000;
app.listen(PORT, () => console.log("listening"));
