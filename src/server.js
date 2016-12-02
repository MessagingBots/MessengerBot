import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import cookieSession from 'cookie-session';
import flash from 'connect-flash';
import bodyParser from 'body-parser';
import config from 'config-heroku';

import routes from './routes/routes';
import fbBotServer from './fbbot/server';
import canvasSubscriptionService from './canvasSubscriptionService';

const DB_URL = config.dbURL;
const storage = require('./db/config')({ dbURL: DB_URL });

const publicPath = path.resolve('public');
const app = express();

// Passport uses Mongoose and StudentSchema
mongoose.connect(DB_URL, {
  autoReconnect: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000,
});

app.set('views', `${publicPath}/views`);
app.set('view engine', 'ejs');

require('./passport/init')(passport);

// Set up express app
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(publicPath));

app.use(cookieSession({
  secret: 'secretssecretsarenofun',
  maxAge: 60 * 60 * 1000,
}));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());

routes(app, passport, storage);

canvasSubscriptionService(storage);

// Load and run the FB Messenger Botkit bot
fbBotServer();

app.listen(process.env.PORT || 3000, (req, res) => {
  console.log(`Application running at port ${(process.env.PORT || 3000)}`);
});
