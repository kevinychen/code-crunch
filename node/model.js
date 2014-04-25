var fs = require('fs');

// map from team name to last submission time
var submissionTimeMap = Object();
const MIN_SUBMISSION_DELAY_TIME = 30000;  // milliseconds

function log(message) {
  fs.appendFile('simplex.log', message);
}

// username: "user1"
// password: "password"
// callback(error, message)
exports.register = function(username, password, callback) {
  // TODO
};

// username: "user1"
// password: "password"
// callback(error)
exports.validateRegistration = function(username, password, callback) {
  // TODO
  callback(false);
}

// username: "user1"
// callback(error, [user object])
exports.getUser = function(username, callback) {
  // TODO
  callback(false, {name: 'kyc', password: 'code'});
  return;
  callback('No user found.');
};

// user: User
// page: url, e.g. "problems"
// callback(error)
exports.canView = function(user, page, callback) {
  // TODO
  callback(false);
};

// callback(error)
exports.isRunning = function(callback) {
  // TODO
  callback(false);
}
