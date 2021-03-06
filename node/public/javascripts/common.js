index = 0;  // problem index
lang = '';
cache = [];  // store problem index -> cached info (submission, results)
var editor;
invalids = [];  // invalid strings for code patent

var javaString = "import java.util.*;\nimport java.io.*;\n\npublic class Main {\n\npublic static void main (String[] args) throws IOException {\n//your code here\n}\n}";
var cppString = "#include <stdio.h>\n#include <stdlib.h>\n#include <iostream>\n#include <math.h>\n#include <string.h>\n#include <algorithm>\n#include <vector>\n\nusing namespace std;\n\nint main() {\n\n//your code here\n\n}";
var pythonString = "#no boilerplate, your code goes here";

// Socket communication
var socket = io.connect('http://localhost:8080');

function toggle(i, language) {
  // Toggle editor
  cache[index] = cache[index] || {};
  cache[index][lang] = editor.getValue();
  cache[index].result = $('.problemresults').html();

  index = i;
  lang = language;
  cache[index] = cache[index] || {};

  // Change language
  if (lang === 'Java') {
    editor.setValue(cache[index][lang] || javaString);
    editor.getSession().setMode('ace/mode/java');
  } else if (lang === 'C++') {
    editor.setValue(cache[index][lang] || cppString);
    editor.getSession().setMode('ace/mode/c_cpp');
  } else if (lang === 'Python') {
    editor.setValue(cache[index][lang] || pythonString);
    editor.getSession().setMode('ace/mode/python');
  }

  // Change index
  $('.problemname').html(cache[index].name);
  var description = cache[index].description || '';
  $('.problemdescription').html(description
      .replace(/[\n]/g, '<br/>').replace(/\\n/g, '<br/>'));

  // Recover new state
  $('.problemresults').html(cache[index].result || '');

  // Ask for server state info
  if (round == 5) {
    socket.emit('twitch', {index: index});
  }
}

$(document).ready(function() {

  // Style the editor
  editor = ace.edit('editor');
  editor.setTheme('ace/theme/monokai');
  toggle(-1, 'Java');

  // Toggle language buttons
  $('.lang').on('mousedown', function() {
    $('.lang').attr('class', 'lang button');
    $(this).attr('class', 'lang buttonpressed');
    toggle(index, $(this).text());
  });

  // Display time remaining
  window.setInterval(function() {
    var now = new Date();
    var timenow = new Date(0, 0, 0, now.getHours(), now.getMinutes(), now.getSeconds());
    var diff = Math.max(0, endTime - timenow);
    if (diff === 0) {
      $('.navnext').show();
    }
    var min = Math.floor(diff / 60000) % 60;
    var sec = ('00' + (Math.floor(diff / 1000) % 60)).slice(-2);
    $('.miscinfo').text(min + ':' + sec);

    // If Code Golf, show number of characters.
    if (round === 2) {
      var charCount = editor.getSession().getValue().length;
      $('.golfcount').html('Characters: ' + charCount);
    }

    // If Code Patent, show invalid patent substrings
    if (round === 3) {
      if (invalids.length > 0) {
        $('.notification').text('PATENTED: [' + invalids + ']');
      } else {
        $('.notification').text('');
      }
    }
  }, 1000);

  socket.on('preRound', function(data) {
    data[round + 1] = data[round + 1] || '23:59';
    var parts = data[round + 1].split(':');
    endTime = new Date(0, 0, 0, parts[0], parts[1], 0);
  });
  socket.on('roundInfo', function(data) {
    if (data.round !== round) {
      return;
    }

    // Update problems list
    $('.round').text(data.roundName);
    var html = '';
    for (var i = 0; i < data.problems.length; i++) {
      if (data.problems[i]) {
        html += '<li id="pselect' + i + '" class="pselect button">' +
    data.problems[i].name + '</li>';
      }
    }
    $('#problems').html(html);

    // Toggle problems
    $('.pselect').on('mousedown', function(e) {
      var id = e.target.id;
      var newIndex = parseInt(id.charAt(id.length - 1));
      cache[newIndex] = cache[newIndex] || {};
      cache[newIndex].name = data.problems[newIndex].name;
      cache[newIndex].description = data.problems[newIndex].description;
      toggle(newIndex, lang);
    });
  });

  // If Code Patent, listen for invalid substrings.
  if (round == 3) {
    window.setInterval(function() {
      socket.emit('patent', {
        user: user,
        entry: editor.getSession().getValue()
      });
    }, 5000);
    socket.on('patentinvalid', function(data) {
      invalids = data;
    });
  }

  // If Code Roulette, change Ace editor background
  if (round == 4) {
    $('.ace_text-layer').addClass('roulette');
    window.setInterval(function() {
      socket.emit('roulette', {
        user: user,
        entry: editor.getSession().getValue()
      });
    }, 5000);
    socket.on('roulettetext', function(data) {
      if (data.error) {
        $('.notification').html(data.error);
        return;
      }
      if (!data.entry) {
        return;
      }
      var text = editor.getSession().getValue().split('\n');
      var other = data.entry.split('\n');
      var newText = '';
      // combine the texts
      for (var line = 0; line < text.length || line < other.length; line++) {
        if (line > 0) {
          newText += '\n';
        }
        var l1 = text[line] || '', l2 = other[line] || '';
        var i1 = 0, i2 = 0;
        while (i1 < l1.length || i2 < l2.length) {
          if (data.parity) {
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
      var origPosition = editor.getCursorPosition();
      editor.setValue(newText);
      editor.moveCursorToPosition(origPosition);
      editor.clearSelection();
    });
  }

  // If Twitch Codes, modify editor
  if (round == 5) {
    editor.setReadOnly(true);
    $('#proposal').focus();
    $('#proposal').on('keypress', function(e) {
      if (e.which == 13) {
        $('.problemresults').html('Processing entry...');
        // Post twitch proposal
        $.post('/twitch', {user: user, index: index, entry: $(this).val()},
          function(data) {
            $('.problemresults').html(data);
            $('#proposal').val('');
          });
      }
    });
    toggle(index, 'Python');
    socket.on('twitchtext', function(data) {
      if (index == data.index) {
        editor.setValue(data.data);
      }
    });
    socket.emit('twitch', {index: index});
  }

  // Submit problem
  $('.submit').on('click', function() {
    var data = editor.getSession().getValue();
    $('.problemresults').html('Grading submission...');
    // If Code Roulette, sync right before submitting
    // (server double checks this anyway)
    if (round === 4) {
      socket.emit('roulette', {
        user: user,
        entry: editor.getSession().getValue()
      });
    }
    $.post('/submit', {round: round, index: index, data: data, lang: lang},
      function(data) {
        $('.problemresults').html(data);
      });
  });

  // Request server for round information
  socket.emit('round', {});
  socket.emit('roundInfo', {round: round});
});

