index = -1;  // problem index
lang = 'Java';
cache = [];  // store problem index -> cached info (submission, results)
$(document).ready(function() {

  // Toggle language buttons
  $('.lang').on('mousedown', function() {
    $('.lang').attr('class', 'lang button');
    $(this).attr('class', 'lang buttonpressed');
    lang = $(this).text();
  });

  // Submit problem
  $('.submit').on('click', function() {
    var data = $('#editor').text();
    $.post('/submit', {round: round, index: index, data: data, lang: lang},
      function(data) {
        $('.problemresults').html(data);
      });
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

    // Update problems list
    $('.round').text(data.roundName);
    var html = '';
    for (var i = 0; i < data.problems.length; i++) {
      html += '<li id="pselect' + i + '" class="pselect button">' +
    data.problems[i].name + '</li>';
    }
    $('#problems').html(html);

    // Toggle problems
    $('.pselect').on('mousedown', function(e) {
      // Save original state
      cache[index] = cache[index] || {};
      cache[index].trial = $('#editor').html();
      cache[index].result = $('.problemresults').html();

      // Change
      var id = e.target.id;
      index = parseInt(id.charAt(id.length - 1));  // lol, assume 1 digit
      $('.problemname').html(data.problems[index].name);
      $('.problemdescription').html(data.problems[index].description);

      // Recover new state
      cache[index] = cache[index] || {};
      $('#editor').text(cache[index].trial || '');
      $('.problemresults').html(cache[index].result || '');
    });
  });

  // Request server for round information
  socket.emit('round', {});
  socket.emit('roundInfo', {round: round});
});

