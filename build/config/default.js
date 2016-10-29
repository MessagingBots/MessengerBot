'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  fb: {
    pageAccessToken: 'EAAQEqpMs06kBABqM0mmbPB8gXj2PIRBMnk6EUjfjX5DkEtrwg3vWGS3mOLK0PMw2n9ZB4ew9MPtzawUlJZAWJ46DMNrPgTAHsFavfO6Kev3eu86FLWeB813qR89guwoNzGfhKjmT2vybJ0TjC6eMmhdSB14a7gCuV56cbZCHAZDZD',
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
    dbURL: 'mongodb://localhost:27017/messenger'
  }
};