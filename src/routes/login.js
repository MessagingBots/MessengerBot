exports.get = (req, res) => {
  res.render('login.ejs', { message: req.flash('loginMessage') });
};

exports.login = passport =>
  (req, res, next) =>
    passport.authenticate('local-login', {
      successRedirect: '/profile',
      failureRedirect: '/login',
      failureFlash: true,
    })(req, res, next);
