'use strict';

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _default = require('../config/default');

var _default2 = _interopRequireDefault(_default);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FacebookStrategy = require('passport-facebook').Strategy;
var Student = require('../models/Student');

var fbConfig = _default2.default.fb;

module.exports = function (passport) {
  passport.use('facebook', new FacebookStrategy({
    clientID: fbConfig.appID,
    clientSecret: fbConfig.appSecret,
    callbackURL: fbConfig.callbackURL,
    passReqToCallback: true
  }, function (req, accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      // find the user in the database based on their facebook id
      Student.findOne({ 'fb.id': profile.id }, function (err, student) {

        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err) {
          return done(err);
        }

        // if the user is found, then log them in
        if (student) {
          return done(null, student); // user found, return that user
        }

        // if there is no user found with that facebook id, create them
        var newStudent = new Student();
        var senderID = '';

        console.log('Attempting to create new student from profile: ');
        console.log(profile);

        // Request the user's Page-Scoped ID and senderID from FB so we can associate their senderID
        _axios2.default.get('https://graph.facebook.com/v2.6/me?access_token=' + _default2.default.fb.pageAccessToken + '&fields=recipient&account_linking_token=' + req.session.account_linking_token).then(function (succ) {
          // set all of the facebook information in our user model
          newStudent.fb.id = profile.id; // set the users facebook id
          // we will save the token that facebook provides to the user
          newStudent.fb.accessToken = accessToken;

          var splitName = profile.displayName.split(' ');

          if (profile.name.givenName === undefined) {
            newStudent.fb.firstName = splitName[0];
          } else {
            newStudent.fb.firstName = profile.name.givenName;
          }

          if (profile.name.familyName === undefined) {
            newStudent.fb.lastName = splitName[1];
          } else {
            newStudent.fb.lastName = profile.name.familyName;
          }

          // Set senderID of the new user object
          newStudent.fb.senderID = succ.data.recipient;

          if (profile.emails) {
            // FB can return multiple emails so we'll take the first
            newStudent.fb.email = profile.emails[0].value;
          }

          // Save student to the database
          newStudent.save(function (error) {
            if (error) {
              console.log('ERROR Saving student');
              console.log(error);
              throw error;
            }

            console.log('Saved the student with data');
            console.log(newStudent);
            // if successful, return the new user
            return done(null, newStudent);
          });
        }).catch(function (error) {
          console.log('Error creating new user from FB callback');
          console.log(error);
          return done(Error);
        });
      });
    });
  }));
};