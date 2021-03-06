const facebook = require('./facebook');
const Student = require('../db/models/Student');
const LocalStrategy = require('passport-local').Strategy;

module.exports = (passport) => {
  // Passport needs to be able to serialize and
  //  deserialize users to support persistent login sessions
  passport.serializeUser((student, done) => {
    done(null, student._id);
  });

  passport.deserializeUser((id, done) => {
    Student.findById(id, (err, student) => {
      done(err, student);
    });
  });

  // Local strategy signup
  passport.use('local-signup', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    // allows us to pass back the entire request to the callback
    passReqToCallback: true,
  }, (req, email, password, done) => {
    // asynchronous
    // User.findOne wont fire unless data is sent back
    process.nextTick(() => {
      // find a user whose email is the same as the forms email
      // we are checking to see if the user trying to login already exists
      Student.findOne({ 'local.email': email }, (err, user) => {
        // if there are any errors, return the error
        if (err) {
          return done(err);
        }
        // check to see if theres already a user with that email
        if (user) {
          return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
        }

        console.log('~~~~~~~~~~~~~~~~~~~``');

        // Are we logged in? Connect a new account
        if (req.user) {
          console.log('req user exists');
          console.log(req.user);
          const newAccount = req.user;
          newAccount.local.email = email;
          newAccount.local.password = newAccount.generateHash(password);
          newAccount.save((error) => {
            if (error) {
              console.log('Error connecting new local account');
              throw error;
            }
            return done(null, newAccount);
          });
        } else {
          // If there is no user with that email and we aren't connecting,
          //  create the user
          const newUser = new Student();

          // set the user's local credentials
          newUser.local.email = email;
          newUser.local.password = newUser.generateHash(password);

          // save the user
          newUser.save((error) => {
            if (error) {
              throw error;
            }
            return done(null, newUser);
          });
        }
      });
    });
  }));

  passport.use('local-login', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
  }, (req, email, password, done) => {
    // find a user whose email is the same as the forms email
    // we are checking to see if the user trying to login already exists
    Student.findOne({ 'local.email': email }, (err, user) => {
      // if there are any errors, return the error before anything else
      if (err) {
        return done(err);
      }
      // if no user is found, return the message
      if (!user) {
        return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
      }

      // if the user is found but the password is wrong
      if (!user.validPassword(password)) {
        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
      }

      // all is well, return successful user
      return done(null, user);
    });
  }));

  // Setting up Passport Strategies for Facebook (add more)
  facebook(passport);
};
