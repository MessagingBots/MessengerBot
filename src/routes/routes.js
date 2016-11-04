/* eslint consistent-return: "off" */
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
    res.render('index.ejs');
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
  app.get('/api/auth/canvas/redirect', (req, res) => {
    console.log('CANVAS!!');
    console.log('req.query');
    console.log(req.query);
    res.send({success: 'succ'});
  });

  // FB messenger both FB linking step 1
  // @TODO!
  // SEE IF WE CAN TIE STATE HERE LIKE WE CAN IN CANVAS
  // https://canvas.instructure.com/doc/api/file.oauth.html
  app.get('/api/auth/facebook', (req, res, next) => {
    let state = '';
    if (req.query.fromBot) {
      state = 'fromBot';
      const senderId = req.query.senderId;
      const pat = req.query.pat;
      const authCode = '1234567890';
      req.session.account_linking_token = req.query.account_linking_token;
      req.session.redirectURI = req.query.redirect_uri;
      req.session.authCode = authCode;
      console.log(req.session.redirectURI);
    }
    passport.authenticate('facebook', {
      scope: ['email', 'public_profile'],
      state
    })(req, res, next);
  });


  // FB messenger both FB linking step 2 (callback from Fb)

  // @TODO: TIE STATE HERE
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
        // Is this the first time a user is linking their account?
        //  If so, redirect to the redirectURI so FB can let our bot know

        console.log('~~~~~~~~~~~~~~~~~~``');
        console.log('REDIRECT URI');
        console.log('REQ STATE');
        console.log(req.query.state);
        if (req.query.state === 'fromBot') {
          return res.redirect(`${req.session.redirectURI}&authorization_code=${req.session.authCode}`);
        }
        return res.redirect('/profile');
      });
    })(req, res, next);
  });

  // Routes for the FB messenger bot webhook
  // app.get('/fbbot/webhook', fbwebhook.get);
  // app.post('/fbbot/webhook', fbwebhook.post);

  /** --------------------
   ** Linking accounts
   ** --------------------
  **/
  //  - local
  app.get('/connect/local', (req, res) => {
    res.render('connect-local.ejs', { message: req.flash('loginMessage') });
  });

  app.post('/connect/local', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/connect/local',
    failureFlash: true,
  }));

  // Facebook
  app.get('/connect/facebook', (req, res, next) => {
    // Clear redirectURI so app doesn't think we're linking messenger
    req.session.redirectURI = '';
    passport.authorize('facebook', {
      scope: ['email', 'public_profile'],
    })(req, res, next);
  });

  app.get('/connect/facebook/callback',
    passport.authorize('facebook', {
      successRedirect: '/profile',
      failureRedirect: '/login',
    }));

  /** --------------------
   ** Unlinking accounts
   ** --------------------
  **/
  //  - local
  app.get('/unlink/local', (req, res) => {
    const user = req.user;
    console.log('user current is');
    console.log(req.user);
    user.local.email = undefined;
    user.local.password = undefined;
    user.save((err) => {
      if (err) {
        console.log('Error unlinking local account')
        throw err;
      }
      res.redirect('/profile');
    });
  });

  //  - Facebook
  app.get('/unlink/facebook', (req, res) => {
    const user = req.user;
    user.fb.accessToken = undefined;
    user.save((err) => {
      if (err) {
        console.log('Error unlinking local account')
        throw err;
      }
      res.redirect('/profile');
    });
  });
};
