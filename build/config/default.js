'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  fb: {
    pageAccessToken: 'EAAQEqpMs06kBALhk9VjnjscErp4y2vXk2StASY6CoZAUVHzzCpHVVBZCDEkKEYl13CUNbV8qBhgsKJzSaprOIN0149oQvspZCuij86fKU53bcIwwEva6fSDbXBBCKInSO5pR6gfqVoHMiOmfNXK3znfzQoZBoxrppZAG4FibxlgZDZD',
    verifyToken: 'my_voice_is_my_password',
    appSecret: '38418c408677e418f36599a3bed9cc96',
    appID: 1131030566982569,
    callbackURL: 'http://localhost:3000/api/auth/facebook/callback'
  },
  dev: {
    API_URL: 'http://localhost:3000/api/',
    SERVER_URL: 'http://localhost:3000/',
    dbURL: 'mongodb://localhost:27017/messenger'
  },
  prod: {
    API_URL: 'http://localhost:3000/api/',
    SERVER_URL: 'http://localhost:3000/',
    dbURL: 'mongodb://zach:zxasqw@ds029496.mlab.com:29496/messenger'
  }
};