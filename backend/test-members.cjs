const axios = require('axios');
require('dotenv').config();

const appId = process.env.COMETCHAT_APP_ID;
const region = process.env.COMETCHAT_REGION;
const apiKey = process.env.COMETCHAT_REST_API_KEY;

const guid = 'ticket-b2f9ac51-dd26-4776-80c4-a9c5feca3c05';

axios.get(`https://${appId}.api-${region}.cometchat.io/v3/groups/${guid}/members`, {
  headers: {
    apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}).then(res => {
  console.log(JSON.stringify(res.data.data, null, 2));
}).catch(err => {
  console.error(err.response?.data || err.message);
});
