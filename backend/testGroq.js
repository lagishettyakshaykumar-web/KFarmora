require('dotenv').config();
const https = require('https');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = `https://api.groq.com/openai/v1/chat/completions`;

const prompt = `Return a simple JSON: {"cropDetected": "Tomato", "confidence": 99}`;

const body = JSON.stringify({
  model: "qwen/qwen3.8-27b",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: "data:image/jpeg;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          }
        }
      ]
    }
  ],
  temperature: 0.1
});

const url = new URL(GROQ_URL);
const options = {
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const request = https.request(options, (response) => {
  let data = '';
  response.on('data', chunk => { data += chunk; });
  response.on('end', () => {
    console.log("Response:", data);
  });
});
request.on('error', console.error);
request.write(body);
request.end();
