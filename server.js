'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const httpProxy = require('http-proxy');
const app = express();

let proxy = httpProxy.createProxyServer({
  changeOrigin: true
});
let isProduction = process.env.NODE_ENV === 'production';
let port = isProduction ? process.env.PORT : 5000;
let publicPath = path.resolve(__dirname, 'public');

if (!isProduction) {
  let bundle = require('./server/bundle.js');
  bundle();

  app.all('/build/*', (req, res) => {
    proxy.web(req, res, {
      target: 'http://localhost:8080'
    });
  });
}

// It is important to catch any errors from the proxy or the
// server will crash. An example of this is connecting to the
// server when webpack is bundling
proxy.on('error', function(e) {
  console.log('Could not connect to proxy, please try again...');
});

// Link static assets
app.use(express.static(publicPath));

app.set('port', (port));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge']);
    } else {
      res.send('Error, wrong token');
    }
})

// Spin up the server
app.listen(app.get('port'), function() {
  console.log(`Server running on port ${port}`);
})
