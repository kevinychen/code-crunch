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

  thisio.sockets.on('connection', function(socket) {
    socket.on('round', function(data) {
      // return which round we are on
      socket.emit('preRound', {round: 2, time: 60});
      socket.emit('startRound', {round: 1});
    });
  });
  thisio.sockets.on('connection', function(socket) {
    socket.on('roundInfo', function(data) {
      // return round info
      socket.emit('roundInfo', {
        roundName: 'Speed Round',
        problems: [{
          name: 'Sum',
          description: 'Add two numbers.'
        }, {
          name: 'Hard',
          description: 'Guess the number I\'m thinking.<br/>It could be any number.'
        }]
      });
    });
  });
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

