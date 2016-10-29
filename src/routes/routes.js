/* eslint consistent-return: "off" */
import axios from 'axios';
import config from '../config/default';
import signup from './signup';
import login from './login';
import fbwebhook from '../fbbot/webhook';

// Route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) {
    return next();
  }
  // if they aren't redirect them to the home page
  res.redirect('/login');
}

module.exports = (app, passport) => {
  app.get('/', (req, res) => {
    res.redirect('/profile');
  });

  app.get('/login', login.get);
  app.post('/login', login.login(passport));

  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.get('/signup', signup.get);
  app.post('/signup', signup.signup(passport));

  app.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile.ejs', { user: req.user });
  });

  // @TODO: Get Canvas instructure dev api key before we can OAuth
  // app.get('/api/auth/canvas', (req, res) => {
  //   const URL = 'https://ufl.instructure.com/login/oauth2/auth?' +
  //     'client_id'
  // });

  app.get('/api/canvas/courses', (req, res) => {
    console.log('User is');
    const user = req.user;
    console.log(user);
    console.log(user.canvas);
    res.send({ user });
  });

  // FB messenger both FB linking step 1
  app.get('/api/auth/facebook', (req, res, next) => {
    let senderId = req.query.senderId;
    let pat = req.query.pat;
    req.session.account_linking_token = req.query.account_linking_token;
    const authCode = '1234567890';
    // let redirectURISuccess = redirectURI + "&authorization_code=" + authCode;
    req.session.redirectURI = req.query.redirect_uri;
    req.session.authCode = authCode;
    passport.authenticate('facebook', {
      scope: ['email', 'public_profile'],
    })(req, res, next);
  });


  // FB messenger both FB linking step 2 (callback from Fb)
  app.get('/api/auth/facebook/callback', (req, res, next) => {
    passport.authenticate('facebook', (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.send({
          error: 'user not found',
        });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(err);
        }
        return res.redirect(`${req.session.redirectURI}&authorization_code=${req.session.authCode}`);
      });
    })(req, res, next);
  });

  // Routes for the FB messenger bot webhook
  app.get('/fbbot/webhook', fbwebhook.get);
  app.post('/fbbot/webhook', fbwebhook.post);
};
