var model = require('./model');
var judge = require('./judge').judge;

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
      model.register(username, password, function(err) {
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
  res.render('round.ejs', {user: req.user, round: 0});
};

exports.controlpanel = function(req, res) {
  // TODO only allow admin access
  res.render('controlpanel.ejs');
};

exports.submit = function(req, res) {
  judge({
    user: req.user,
    problemId: req.body.round + '-' + req.body.index,
    data: req.body.data,
    language: req.body.lang
  }, function(err) {
    res.json(err || 'Congratulations! You have solved the problem.');
  });
};

var twitching = false;
exports.twitch = function(req, res) {
  var entry = req.body.entry;
  if (entry.indexOf('print') > -1) {
    res.json('Print statements are not allowed.');
    return;
  }
  entry.replace('\n', '');

  var syncBlock = function() {
    twitching = true;  // take lock
    model.getTwitch(req.body.index, function(err, data) {
      entire = data + entry + '\n';
      if (entry.slice(-1) == ':' || entry.slice(-1) == '\\') {
        entire += Array(80).join(' ') + 'pass\n';
      }
      entire += 'print ans';
      judge({
        user: req.user,
        problemId: '5-1',
        data: entire,
        language: 'Python'
      }, function(err) {
        if (err && err !== 'Incorrect output') {
          twitching = false;
          res.json(err);
        } else {
          if (err) {
            res.json('Line accepted.');
          } else {
            res.json('Congratulations! You have solved the problem.');
          }
          model.addTwitch(req.body.index, req.body.user, entry, function() {
            twitching = false;  // release lock
          });
        }
      });
    });
  };

  var waiting = function() {
    if (twitching) {
      setTimeout(waiting, 1000);
    } else {
      syncBlock();
    }
  };

  waiting();
};

exports.round = function(req, res) {
  res.render('round.ejs', {user: req.user, round: parseInt(req.query.round)});
};

