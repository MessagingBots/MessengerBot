# MessengerBot
Messenger bots and API

# Instructions

## Config
We use [config-heroku](https://www.npmjs.com/package/config-heroku) on top of [node-config](https://www.npmjs.com/package/config) to deploy our local config to heroku

1. Run `npm install --save node-config config-heroku` to get the needed packages
2. Create a `config` directory, with `default.json`, `dev.json` and `heroku.json`
3. Common config, like Facebook app (not including `callbackURL`) info will go in `default.json`, config for your local development should go in `dev.json`, and config for production will
go in `heroku.json`
4. After changing your config, run `config-heroku save` to deploy it to Heroku
* Alternatively, you can run `config-heroku hook add heroku HEROKU_CONFIG <YOUR APP NAME HERE>`
to create a git hook that will auto-update your `HEROKU_CONFIG` file on Heroku when you make a commit
6. To use config in your code, import it normally, like `import config from 'config-heroku'`, and access
it like you would a normal config.json file, i.e. `config.PROPERTY_NAME`

Our `default.json` looks like:

    {
      "fb": {
        "pageAccessToken": "YOUR_PAGE_ACCESS_TOKEN",
        "verifyToken": 'YOUR_APP_WEBHOOK_VERIFY_TOKEN",
        "appSecret": "YOUR_APP_SECRET",
        "appID": YOUR_APP_ID,
        "callbackURL": "YOUR_FB_APP_MESSENGER_CALLBACK_URL"
      },
      "dbURL": "mongodb://localhost:27017/messenger"
    }

`heroku.json` should have deployment-specifig config like:

    {
      "fb": {
        "callbackURL": "HEROKU_BASED_FB_APP_MESSENGER_CALLBACK"
      },
      "API_URL": "HEROKU_APP_URL/api/",
      "SERVER_URL": "HEROKU_APP_URL",
    }

## Development
To run the app in a dev environment:

* run `gulp --dev`

## Production
To run in a production environment:

* run `gulp --production`

`gulp` will create a `build` directory with the transpiled JS and also run a watch server to re-build any time you make changes to your files
