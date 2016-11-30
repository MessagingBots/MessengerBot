exports.get = (req, res) => {
  res.render('login.ejs', { message: req.flash('loginMessage') });
};

exports.login = passport =>
  (req, res, next) => {
    console.log('loggig in!');
    return passport.authenticate('local-login', {
      successRedirect: '/profile',
      failureRedirect: '/login',
      failureFlash: true,
    })(req, res, next);
  };
