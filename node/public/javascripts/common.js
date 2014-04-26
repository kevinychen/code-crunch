lang = 'Java';
$(document).ready(function() {

  // Toggle language buttons
  $('.lang').on('mousedown', function() {
    $('.lang').attr('class', 'lang button');
    $(this).attr('class', 'lang buttonpressed');
    lang = $(this).text();
  });

  // Display time remaining
  window.setInterval(function() {
    var diff = Math.max(0, endTime - new Date());
    var min = Math.floor(diff / 60000);
    var sec = ('00' + (Math.floor(diff / 1000) % 60)).slice(-2);
    $('.miscinfo').text(min + ':' + sec);
  }, 1000);

  // Socket communication
  var socket = io.connect('http://localhost:8080');
  socket.on('preRound', function(data) {
    endTime = new Date(data.time);
  });
  socket.on('startRound', function (data) {
    if (data.round > round) {
      $('.navnext').show();
    }
  });
  socket.on('roundInfo', function(data) {
    if (data.round !== round) {
      return;
    }
    $('.round').text(data.roundName);
    var html = '';
    for (var i = 0; i < data.problems.length; i++) {
      html += '<li id="pselect' + i + '" class="pselect button">' +
    data.problems[i].name + '</li>';
    }
    $('#problems').html(html);
    $('.pselect').on('mousedown', function(e) {
      var id = e.target.id;
      var index = parseInt(id.charAt(id.length - 1));  // lol, assume 1 digit
      $('.problemname').html(data.problems[index].name);
      $('.problemdescription').html(data.problems[index].description);
    });
  });
  socket.emit('round', {});
  socket.emit('roundInfo', {round: 1});
});

