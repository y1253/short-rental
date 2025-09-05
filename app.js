import express from "express";
import main from "./routes/main.js";
import users from "./routes/users.js";
import auth from "./routes/auth.js";
import payments from "./routes/payments.js";
import path from "path";
import fileUpload from "express-fileupload";
import cors from "cors";
import fs from 'fs'
import compression from "compression";
//import " express-async-errors";
import https from "https";
import helmet from "helmet";
import error from "./routes/error.js";
import { fileURLToPath } from "url";
import postWebViews from "./db/postWebViews.js";
import { log } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(compression());
//app.use(cors({ credentials: true }));

// app.use(cors({
//   'allowedHeaders': ['sessionId', 'Content-Type','x-auth-token','authorization','X-Requested-With'],
//   'exposedHeaders': ['sessionId'],
//   'origin': 'https://rentmeech.com',
//   'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   'preflightContinue': false
// }));
// app.use(
//   cors({
//     allowedHeaders: [
//       "sessionId",
//       "Content-Type",
//       "x-auth-token",
//       "authorization",
//     ],
//     exposedHeaders: ["sessionId"],
//     origin: "https://rentmeech.com",
//     methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//     preflightContinue: false,
//   })
// );

//////////previse used
// app.use(cors({
//   'allowedHeaders': ['sessionId', 'Content-Type','x-auth-token','authorization','X-Requested-With'],
//   'exposedHeaders': ['sessionId'],
//   'origin': "https://rentmeech.com",
     
//   'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   'preflightContinue': false
// }));
//app.use(cors())
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // if (origin === "https://rentmeech.com" || origin === "http://rentmeech.com" ) {
  //   res.setHeader("Access-Control-Allow-Origin", origin);
  // }
  
  
  res.setHeader("Access-Control-Allow-Origin", 'https://rentmeech.com');
  // res.header('Access-Control-Allow-Origin', '*');
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "sessionId,Content-Type,x-auth-token,authorization,X-Requested-With");
  res.setHeader("Access-Control-Expose-Headers", "sessionId");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});
app.use(express.json());
app.use(fileUpload());

app.use("/short_rental", main);
app.use("/upload", express.static("./upload"));
app.use("/api", payments);
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "tryout.html"));
});
app.get('/web-views',async(req,res)=>{
  const results=await postWebViews()
  console.log(results);
  
  res.status(200).send('insert sucsessfuly num '+results[0]['count(view)'])
})
app.use(error);

const options = {
  pfx: fs.readFileSync("./certificate-plexus.pfx"),
  passphrase: "Chillygutman",
};

const PORT = 443;
const host ='0.0.0.0'
https.createServer(options, app).listen(PORT,host, () => {
  console.log(`The server is now running and listening for requests on PORT ${PORT}
    GO TO http://localhost:${PORT}`);
});

