/*
 * socket.io API
 */

var fs = require('fs');
var exec = require('child_process').exec;
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
      model.canView(null, 'round', data, function(canView) {
        if (canView) {
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
  thisio.sockets.on('connection', function(socket) {
    socket.on('patent', function(data) {
      // Write to a file that a thread will constantly go through
      fs.writeFile('submissions/t_' + data.user, data.entry);
    });
  });
  thisio.sockets.on('connection', function(socket) {
    socket.on('roulette', function(data) {
      model.roulettePartner(data.user, data.entry,
        function(err, partner, parity, partnerEntry) {
          socket.emit('roulettetext', {
            error: err,
            parity: parity,
            partner: partner,
            entry: partnerEntry
          });
        });
    });
  });
};

model.setShowtimesListener(function(error, showtimes) {
  emitAll('preRound', showtimes);
});

function checkPatents() {
  exec('python scripts/checkPatents.py', function(err, stdout, stderr) {
    var lines = stdout.split('\n');
    var patents = [];
    for (var i = 0; i < lines.length; i++) {
      if (lines[i]) {
        patents.push(lines[i].replace('\\n', '\n'));
      }
    }
    model.setInvalids(patents);
    emitAll('patentinvalid', patents);
    setTimeout(checkPatents, 5000);
  });
}
checkPatents();
