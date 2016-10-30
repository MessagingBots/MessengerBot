import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import session from 'express-session';
import flash from 'connect-flash';
import bodyParser from 'body-parser';

import routes from './routes/routes';
import config from './config/default';

// const DB_URL = (process.env.NODE_ENV === 'prod') ?
  // config.prod.dbURL : config.dev.dbURL;
const DB_URL = config.prod.dbURL;

const publicPath = path.resolve('public');
const app = express();

app.set('views', `${publicPath}/views`);
app.set('view engine', 'ejs');

require('./passport/init')(passport);

mongoose.connect(DB_URL);

console.log('heroku');
console.log('config');
console.log(config);
// Set up express app
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(publicPath));

// Passport setup
app.use(session({
  secret: 'secretssecretsarenofun',
  resave: true,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());

routes(app, passport);

app.listen(process.env.PORT || 3000, (req, res) => {
  console.log('Messaging bot server running at port ' + (process.env.PORT || 3000));
});

