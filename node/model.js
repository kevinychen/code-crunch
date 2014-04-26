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
    if (!usersSnapshot.hasChild(username)) {
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
// callback(error)
exports.canView = function(user, page, params, callback) {
  if (page !== 'round') {
    callback(false);
  } else {
    root.child('canView').once('value', function(canViewSnapshot) {
      callback(canViewSnapshot.val() >= params.round);
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
        problem.name = problemSnapshot.name();
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
      callback(false, data.val());
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
  solvedRef.on('value', function(solved) {
    if (solved) {
      callback();
    } else {
      solvedRef.set(true);
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
