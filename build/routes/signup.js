'use strict';

exports.get = function (req, res) {
  res.render('signup.ejs', { message: req.flash('signupMessage') });
};

exports.signup = function (passport) {
  return function (req, res, next) {
    return passport.authenticate('local-signup', {
      successRedirect: '/profile',
      failureRedirect: '/signup',
      failureFlash: true
    })(req, res, next);
  };
};