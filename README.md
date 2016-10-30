# MessengerBot
Messenger bots and API

# Instructions

## Config
Run `npm install --save json5` to be able to create .json5 files, then create a config directory with two files:

* `dev.json5`
* `production.json5`

These files contain the same JSON5 structure:

`{
  fb: {
    pageAccessToken: 'YOUR_PAGE_ACCESS_TOKEN',
    verifyToken: 'YOUR_APP_WEBHOOK_VERIFY_TOKEN',
    appSecret: 'YOUR_APP_SECRET',
    appID: YOUR_APP_ID,
    callbackURL: 'YOUR_FB_APP_MESSENGER_CALLBACK_URL',
  },
  API_URL: 'http://localhost:3000/api/',
  SERVER_URL: 'http://localhost:3000/',
  dbURL: 'mongodb://localhost:27017/messenger',
}`

The point of each is to hold the respective information for your development and production environments.

## Development
To run the app in a dev environment:

* run `gulp --dev`

## Production
To run in a production environment:

* run `gulp --prod`

`gulp` will create a `build` directory with the transpiled JS and also run a watch server to re-build any time you make changes to your files
