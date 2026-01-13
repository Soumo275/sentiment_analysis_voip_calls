const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
require("dotenv").config();

const { AccessToken } = twilio.jwt;
const { VoiceGrant } = twilio.jwt.AccessToken;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_API_KEY_SID,
  TWILIO_API_KEY_SECRET,
  TWILIO_TWIML_APP_SID,
  TWILIO_CALLER_ID,
  PORT = 3000
} = process.env;

// 1. Issue access tokens for browser clients
app.get("/token", (req, res) => {
  const identity = req.query.identity || "user_" + Date.now(); 

  // Create a Voice grant
  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: TWILIO_TWIML_APP_SID,  // correct env var
    incomingAllow: true,
  });

  // Create an access token
  const token = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    { identity }  
  );

  token.addGrant(voiceGrant);

  res.send({ token: token.toJwt(), identity });
});

// 2. TwiML endpoint to bridge call from browser → PSTN
app.post("/voice", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const to = req.body.To || req.body.phoneNumber;

  if (to) {
    const dial = twiml.dial({ callerId: TWILIO_CALLER_ID });
    dial.number(to);
  } else {
    twiml.say("No destination number provided.");
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

app.listen(PORT, () =>
  console.log(`Server running → http://localhost:${PORT}`)
);
