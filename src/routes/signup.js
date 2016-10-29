exports.get = (req, res) => {
  res.render('signup.ejs', { message: req.flash('signupMessage') });
};

exports.signup = passport =>
  (req, res, next) =>
    passport.authenticate('local-signup', {
      successRedirect: '/profile',
      failureRedirect: '/signup',
      failureFlash: true,
    })(req, res, next);
