'use strict';

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _default = require('../config/default');

var _default2 = _interopRequireDefault(_default);

var _signup = require('./signup');

var _signup2 = _interopRequireDefault(_signup);

var _login = require('./login');

var _login2 = _interopRequireDefault(_login);

var _webhook = require('../fbbot/webhook');

var _webhook2 = _interopRequireDefault(_webhook);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) {
    return next();
  }
  // if they aren't redirect them to the home page
  res.redirect('/login');
} /* eslint consistent-return: "off" */


module.exports = function (app, passport) {
  app.get('/', function (req, res) {
    res.redirect('/profile');
  });

  app.get('/login', _login2.default.get);
  app.post('/login', _login2.default.login(passport));

  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

  app.get('/signup', _signup2.default.get);
  app.post('/signup', _signup2.default.signup(passport));

  app.get('/profile', isLoggedIn, function (req, res) {
    res.render('profile.ejs', { user: req.user });
  });

  // @TODO: Get Canvas instructure dev api key before we can OAuth
  // app.get('/api/auth/canvas', (req, res) => {
  //   const URL = 'https://ufl.instructure.com/login/oauth2/auth?' +
  //     'client_id'
  // });

  app.get('/api/canvas/courses', function (req, res) {
    console.log('User is');
    var user = req.user;
    console.log(user);
    console.log(user.canvas);
    res.send({ user: user });
  });

  // FB messenger both FB linking step 1
  app.get('/api/auth/facebook', function (req, res, next) {
    var senderId = req.query.senderId;
    var pat = req.query.pat;
    req.session.account_linking_token = req.query.account_linking_token;
    var authCode = '1234567890';
    // let redirectURISuccess = redirectURI + "&authorization_code=" + authCode;
    req.session.redirectURI = req.query.redirect_uri;
    req.session.authCode = authCode;
    passport.authenticate('facebook', {
      scope: ['email', 'public_profile']
    })(req, res, next);
  });

  // FB messenger both FB linking step 2 (callback from Fb)
  app.get('/api/auth/facebook/callback', function (req, res, next) {
    passport.authenticate('facebook', function (err, user, info) {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.send({
          error: 'user not found'
        });
      }

      req.login(user, function (loginErr) {
        if (loginErr) {
          return next(err);
        }
        return res.redirect(req.session.redirectURI + '&authorization_code=' + req.session.authCode);
      });
    })(req, res, next);
  });

  // Routes for the FB messenger bot webhook
  app.get('/fbbot/webhook', _webhook2.default.get);
  app.post('/fbbot/webhook', _webhook2.default.post);
};