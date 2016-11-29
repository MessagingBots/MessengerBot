/* eslint consistent-return: "off" */
import config from 'config-heroku';
import signup from './signup';
import login from './login';

const DB_URL = config.dbURL;
const API_URL = config.API_URL;


// Route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) {
    return next();
  }
  // if they aren't redirect them to the home page
  res.redirect('/login');
}

module.exports = (app, passport, storage) => {
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
    res.render('profile.ejs', {
      user: req.user,
      API_URL,
    });
  });

  app.post('/api/subscribe/:courses', (req, res) => {
    const courses = req.params.courses.split(',');
    res.send('your courses are ' +
      courses.map(course => course).join('\n'));
  });

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
    res.send({
      success: 'succ',
    });
  });

  // FB messenger bot FB linking step 1
  app.get('/api/auth/facebook', (req, res, next) => {
    let state = '';
    if (req.query.fromBot) {
      // Set FB state to be fromBot so we know this came from Messenger
      state = 'fromBot';
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

        // Special redirect if login came from Messenger
        if (req.query.state === 'fromBot') {
          return res.redirect(`${req.session.redirectURI}&authorization_code=${req.session.authCode}`);
        }
        console.log('User was logged in');
        console.log(user);
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

  app.post('/api/connect/canvas', isLoggedIn, (req, res) => {
    const newToken = req.body.newToken;

    if (!newToken) {
      res.status(400);
      res.send({
        error: 'No new token was specified',
      });
    } else {
      storage.students.update(req.user._id,
        { 'canvas.token': newToken },
        (err, user) => {
          if (err) {
            console.log('Error updating user\'s Canvas token');
            console.log(err);
            res.status(400);
            res.send({
              error: err,
            });
          } else if (!user) {
            console.log('No user found...');
            res.status(400);
            res.send({
              error: 'No user found...try logging in again',
            });
          } else {
            console.log('Updated user\'s canvas token!');
            console.log(user.canvas.token);
            res.send({
              success: 'true',
            });
          }
        });
    }
  });

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
