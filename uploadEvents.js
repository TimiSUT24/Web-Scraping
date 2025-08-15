require('dotenv').config();
const fs = require('fs');
const axios = require('axios');


if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const allEvents = JSON.parse(fs.readFileSync('allEvents.json', 'utf-8'));

axios.post(process.env.Upload_API_URL, allEvents,{
  headers:{
    'X-API-KEY': process.env.UploadEventsKey
  }
})
  .then(res => console.log('✅ Upload success:', res.data))
  .catch(err => {
    console.error('❌ Upload failed');
    if (err.response) {
      console.error(err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
  });