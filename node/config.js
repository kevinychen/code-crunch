var model = require('./model');
var LocalStrategy = require('passport-local').Strategy;

// Server listens to this port
exports.port = 8080;

// Router for handling security/permissions
exports.router = function(req, res, next) {
  var parts = req.url.split('/');
  var page = parts[1];  // first entry is null string
  if (req.user) {
    model.canView(req.user, page, req.params, function(canView) {
      if (canView) {
        next();
      } else {
        res.type('txt').send('401 Not authorized');
      }
    });
  } else {
    var publicURLs = ['register', 'login', 'logout', 'rules'];
    if (publicURLs.indexOf(page) != -1) {
      next();
    } else {
      res.redirect('/login');
    }
  }
};

// Strategy for session authentication
exports.strategy = new LocalStrategy(function(username, password, callback) {
  model.getUser(username, function(err, user) {
    if (err || user.password != password) {
      callback(null, false);
    } else {
      callback(null, user);
    }
  });
});

// Deserialize function for users
exports.deserializeUser = model.getUser;
