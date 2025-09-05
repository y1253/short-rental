import { OAuth2Client } from "google-auth-library";
import * as https from "https";
https.globalAgent.options.rejectUnauthorized = false;
//import https from "https";
//import { create } from "ssl-root-cas";

//https.globalAgent.options.ca = create();
const client = new OAuth2Client(
  "876794026344-eheb75ln2lc5rh82a8pej6ohr937u037.apps.googleusercontent.com"
);

async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience:
        "876794026344-eheb75ln2lc5rh82a8pej6ohr937u037.apps.googleusercontent.com",
    });

    return ticket.getPayload();
  } catch (error) {
    console.error("Error verifying Google token:", error);
    return null;
  }
}
export default verifyGoogleToken;
