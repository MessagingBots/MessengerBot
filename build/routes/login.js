'use strict';

exports.get = function (req, res) {
  res.render('login.ejs', { message: req.flash('loginMessage') });
};

exports.login = function (passport) {
  return function (req, res, next) {
    return passport.authenticate('local-login', {
      successRedirect: '/profile',
      failureRedirect: '/login',
      failureFlash: true
    })(req, res, next);
  };
};