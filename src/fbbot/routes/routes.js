/* eslint-disable brace-style */
/* eslint-disable camelcase */
import config from 'config-heroku';
import express from 'express';

const router = express.Router();
const FB_VERIFY_TOKEN = config.fb.verifyToken;
const facebook_handler = require('../bot').handler;

router.get('/', (req, res) => {
  res.send({ sup: 'sup' });
});

router.get('/webhook', (req, res) => {
  // This enables subscription to the webhooks
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  }
  else {
    res.send('Incorrect verify token');
  }
});

router.post('/webhook', (req, res) => {
  facebook_handler(req.body);

  res.send('ok');
});

module.exports = router;
