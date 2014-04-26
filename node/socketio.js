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
      model.getShowtimes(function(error, showtimes) {
        socket.emit('preRound', showtimes);
      });
    });
  });
  thisio.sockets.on('connection', function(socket) {
    socket.on('roundInfo', function(data) {
      model.canView(null, 'round', data.round, function(err) {
        if (!err) {
          model.getRound(data.round, function(err, round) {
            if (round && round.problems) {
              round.round = data.round;
              for (var problem in round.problems) {
                delete round.problems[problem].judge;
              }
              socket.emit('roundInfo', round);
            }
          });
        }
      });
    });
  });
};

model.setShowtimesListener(function(error, showtimes) {
  emitAll('preRound', showtimes);
});

