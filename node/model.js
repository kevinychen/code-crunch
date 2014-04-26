var fs = require('fs');
var Firebase = require('firebase');
var root = new Firebase('https://code-crunch.firebaseIO.com');
root.auth('Fw9Wx7TuSzL3OIr9kKMYoQoKeFHyxBMfleQeGGyY');

// map from team name to last submission time
var submissionTimeMap = Object();
const MIN_SUBMISSION_DELAY_TIME = 10000;  // milliseconds

function log(message) {
  fs.appendFile('simplex.log', message);
}

// username: "user1"
// password: "password"
// callback(error, message)
exports.register = function(username, password, callback) {
  root.child('users').once('value', function(usersSnapshot) {
    if (usersSnapshot.hasChild(username)) {
      callback('That team name already exists.');
    } else {
      usersSnapshot.child(username).ref().set({
        password: password,
        score: 0
      });
      callback();
    }
  });
};

// username: "user1"
// password: "password"
// callback(error)
exports.validateRegistration = function(username, password, callback) {
  if (!username) {
    callback('No username provided.');
  } else if (!username.match(/^[A-Za-z][A-Za-z0-9_]*$/)) {
    callback('Invalid username.');
  } else {
    callback();
  }
};

// username: "user1"
// callback(error, [user object])
exports.getUser = function(username, callback) {
  root.child('users').once('value', function(usersSnapshot) {
    if (!usersSnapshot.hasChild(username)) {
      callback('No user found.');
    } else {
      var userSnapshot = usersSnapshot.child(username);
      callback(false, {
        name: userSnapshot.name(),
        password: userSnapshot.val().password,
        score: userSnapshot.val().score
      });
    }
  });
};

// user: User
// page: url, e.g. "problems"
// params: {round: round #}
// callback(canView)
exports.canView = function(user, page, params, callback) {
  if (page !== 'round') {
    callback(true);
  } else if (!params.round || !params.round.toString().match(/^[0-9]$/)) {
    callback(false);
  } else {
    root.child('showtimes/' + params.round).once('value',
        function(showtimeSnapshot) {
          // Check that current time is later than round showtime.
          var time = showtimeSnapshot.val();
          if (!time) {  // showtime not listed; cannot view
            callback(false);
            return;
          }
          time = time.split(':');
          var showtime = new Date(0, 0, 0, time[0], time[1], 0);
          var now = new Date();
          var nowtime = new Date(0, 0, 0, now.getHours(),
            now.getMinutes(), now.getSeconds());
          callback(nowtime >= showtime);
        });
  }
};

// callback(isRunning)
exports.isRunning = function(callback) {
  root.child('isRunning').once('value', function(isRunningSnapshot) {
    callback(isRunningSnapshot.val());
  });
};

// return times when each round will be open
// callback(error, {1: '7:05', 2: '7:26', ...})
exports.getShowtimes = function(callback) {
  root.child('showtimes').once('value', function(showtimesSnapshot) {
    callback(false, showtimesSnapshot.val());
  });
};

exports.setShowtimesListener = function(callback) {
  root.child('showtimes').on('value', function(showtimesSnapshot) {
    callback(false, showtimesSnapshot.val());
  });
}

// callback(error, [round object])
exports.getRound = function(roundId, callback) {
  root.child('rounds/' + roundId).once('value', function(roundSnapshot) {
    callback(false, roundSnapshot.val());
  });
}

// callback(error, [problem object])
exports.getProblem = function(problemId, callback) {
  var parts = problemId.split('-');
  root.child('rounds/' + parts[0] + '/problems/' + parts[1]).once('value',
      function(problemSnapshot) {
        var problem = problemSnapshot.val();
        problem.round = parts[0];
        problem.id = parts[1];
        callback(false, problem);
      });
};

// callback(error, submissionID)
exports.assignSubmissionID = function(user, problem, callback) {
  root.child('submissionID').transaction(function(submissionID) {
    return submissionID + 1;
  }, function(err, committed, data) {
    if (err) {
      callback(err);
    } else if (!committed) {
      callback('System error: submit problem');
    } else {
      var index = ('0000' + parseInt(data.val())).slice(-5);
      var name = index + '_' + user.name + '_' + problem.name;
      callback(false, name);
    }
  });
};

// callback(error, [list of judge inputs])
exports.getJudgeInputs = function(problem, callback) {
  root.child('rounds/' + problem.round + '/problems/' + problem.id + '/judge')
    .once('value', function(judgeSnapshot) {
      callback(false, judgeSnapshot.val());
    });
};

// callback(error)
exports.solveProblem = function(user, problem, callback) {
  var userRef = root.child('users/' + user.name);
  var solvedRef = userRef.child('solved/' + problem.round + '-' + problem.id);
  solvedRef.on('value', function(solvedSnapshot) {
    var solved = solvedSnapshot.val();
    if (solved && solved >= problem.value) {
      callback();
    } else {
      if (solved) {
        problem.value -= solved;
      }
      solvedRef.set(problem.value);
      userRef.child('score').transaction(function(score) {
        return score + problem.value;
      }, function(err, committed, data) {
        if (err) {
          callback(err);
        } else if (!committed) {
          callback('System error: submit problem');
        } else {
          callback(false);
        }
      });
    }
  });
};

/*
 * Custom round functions
 */

// Invalid substrings for Code Patent
var invalids = [];
exports.setInvalids = function(patents) {
  invalids = patents;
}

// Save user entry, get partner entry
// callback(error, partner, parity, entry)
function roulettePartner(user, entry, callback) {
  root.child('users').once('value', function(usersSnapshot) {
    // Save own entry.
    usersSnapshot.child(user + '/roulette/entry').ref().set(entry);

    var users = usersSnapshot.val();
    var partner = null;
    if (!users[user].roulette || !users[user].roulette.partner) {
      // If no partner, find one.
      for (var other in users) {
        if (other != user && !users[other].roulette) {
          partner = other;
          usersSnapshot.child(user + '/roulette').ref().set({
            partner: other,
            parity: false
          });
          usersSnapshot.child(other + '/roulette').ref().set({
            partner: user,
            parity: true
          });
          break;
        }
      }
      if (!partner) {
        callback('You have no partner.');
        return;
      }
      callback(false, partner, false, undefined);
    } else {
      partner = users[user].roulette.partner;
      var partnerData = users[partner].roulette;
      if (partnerData) {
        callback(false, partner, partnerData.parity, partnerData.entry);
      } else {
        callback(false, partner, false, undefined);
      }
    }
  });
}
exports.roulettePartner = roulettePartner;

exports.getTwitch = function(index, callback) {
  fs.readFile('submissions/u_' + index, "utf8", function(err, data) {
    callback(false, (err || !data) ? '' : data);
  });
}

var twitchBroadcast = function() {};

exports.setTwitchBroadcastFunction = function(func) {
  twitchBroadcast = func;
};

exports.addTwitch = function(index, user, entry, callback) {
  var userCount = root.child('twitch/' + index + '/' + user);
  userCount.once('value', function(countSnapshot) {
    var count = countSnapshot.val();
    userCount.set(count ? count + 1 : 1);
    fs.appendFile('submissions/u_' + index, entry + '\n', function() {
      twitchBroadcast(index);
      callback();
    });
  });
}

// callback(error)
exports.process = function(params, callback) {
  params.problem.score = params.problem.score || 10;

  // Code Golf: set up score
  if (params.problem.round == 2) {
    params.problem.score -= params.data.length;
  }

  // Code Patent: check validation
  if (params.problem.round == 3) {
    for (var i = 0; i < invalids.length; i++) {
      if (invalids[i] && params.data.indexOf(invalids[i]) >= 0) {
        callback('Invalid: used patented substrings');
        return;
      }
    }
  }

  // Code Roulette: ensure the solution is a combination of both users
  if (params.problem.round == 4) {
    roulettePartner(params.user.name, params.data,
        function(err, partner, parity, partnerEntry) {
          // Ew, complete duplication of this code
          var text = params.data.split('\n');
          var other = partnerEntry.split('\n');
          var newText = '';
          // combine the texts
          for (var line = 0; line < text.length || line < other.length; line++) {
            if (line > 0) {
              newText += '\n';
            }
            var l1 = text[line] || '', l2 = other[line] || '';
            var i1 = 0, i2 = 0;
            while (i1 < l1.length || i2 < l2.length) {
              if (parity) {
                newText += l1[i1] || ' ';
                newText += l2[i2 + 1] || ' ';
              } else {
                newText += l2[i2] || ' ';
                newText += l1[i1 + 1] || ' ';
              }
              i1 += 2;
              i2 += 2;
            }
          }
          params.data = newText;
          callback();
          return;
        });
  }

  callback();
};
