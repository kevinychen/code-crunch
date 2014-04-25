/*
 * socket.io API
 */

var model = require('./model');

thisio = '';

function emitAll(title, data) {
  var clients = thisio.sockets.clients();
  for (var i = 0; i < clients.length; i++) {
    clients[i].emit(title, data);
  }
}

exports.setServer = function(server) {
  thisio = require('socket.io').listen(server);
};

exports.preRound = function(req, res) {
  emitAll('preRound', {
    round: req.body.round || 1,
    time: req.body.time || 60
  });
  res.end();
};

exports.startRound = function(req, res) {
  emitAll('startRound', {round: req.body.round || 1});
  res.end();
};
