index = -1;  // problem index
lang = '';
cache = [];  // store problem index -> cached info (submission, results)
var editor;

var javaString = "import java.util.*;\nimport java.io.*;\n\npublic class Main {\n\npublic static void main (String[] args) throws IOException {\n//your code here\n}\n}";
var cppString = "#include <stdio.h>\n#include <stdlib.h>\n#include <iostream>\n#include <math.h>\n#include <string.h>\n#include <algorithm>\n#include <vector>\n\nusing namespace std;\n\nint main() {\n\n//your code here\n\n}";
var pythonString = "#no boilerplate, your code goes here";

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
  $('.problemdescription').html(cache[index].description);

  // Recover new state
  $('.problemresults').html(cache[index].result || '');
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

  // Submit problem
  $('.submit').on('click', function() {
    var data = editor.getSession().getValue();
    $('.problemresults').html('Grading submission...');
    $.post('/submit', {round: round, index: index, data: data, lang: lang},
      function(data) {
        $('.problemresults').html(data);
      });
  });

  // Display time remaining
  window.setInterval(function() {
    var diff = Math.max(0, endTime - new Date());
    if (diff === 0) {
      $('.navnext').show();
    }
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

  // Request server for round information
  socket.emit('round', {});
  socket.emit('roundInfo', {round: round});
});

