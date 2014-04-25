var model = require('./model');

exports.preregister = function(req, res) {
  res.render('register.ejs', {error: ''});
};

exports.register = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  if (password !== req.body.confirmpassword) {
    res.render('register.ejs', {error: 'Passwords don\'t match'});
    return;
  }
  model.validateRegistration(username, password, function(err) {
    if (err) {
      res.render('register.ejs', {error: err});
    } else {
      model.register(username, password, function(err, message) {
        if (err) {
          res.render('register.ejs', {error: err});
        } else {
          res.redirect(307, '/firstlogin');  // 307 copies req.body
        }
      });
    }
  });
};

exports.login = function(req, res) {
  res.render('login.ejs');
};

exports.logout = function(req, res) {
  req.session.regenerate(function() {
    req.logout();
    res.redirect('/login');
  });
};

exports.rules = function(req, res) {
  res.render('rules.ejs');
};

exports.home = function(req, res) {
  res.render('home.ejs');
};

