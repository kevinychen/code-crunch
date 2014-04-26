/**
 * Basic Tester API
 */

var fs = require('fs');
var exec = require('child_process').exec;

function Tester(SUBMISSION_DIRECTORY) {
  this.SUBMISSION_DIRECTORY = SUBMISSION_DIRECTORY;

  if (!fs.existsSync(SUBMISSION_DIRECTORY)) {
    fs.mkdirSync(SUBMISSION_DIRECTORY);
  }
}

function getExtension(language) {
  if (language === 'C++') {
    return '.cpp';
  } else if (language === 'Java') {
    return '.java';
  } else if (language === 'Python') {
    return '.py';
  }
}

function getJavaName(dest) {
  var res = dest.split('/');
  return res.pop();
}

function substituteJava(javaSource, name) {
  return javaSource.replace(/public\s+class\s+\w+\s*{/im,
    'public class ' + name + ' {');
}

Tester.prototype.prepare = function(submissionID, language, data, callback) {
  // Write the data to SUBMISSION_DIRECTORY + 's' + submissionID + [extension]
  var filename = 's' + submissionID;
  var fullname = this.SUBMISSION_DIRECTORY + filename;
  var path = fullname + getExtension(language);
  if (language === 'Java') {
    data = substituteJava(data, filename);
  }
  fs.writeFile(path, data, function(err) {
    if (err) {
      callback('Error uploading file');
    } else {
      // compile
      var command = '';
      if (language === 'C++') {
        command = 'g++ -o ' + fullname + '.o ' + path;
      } else if (language === 'Java') {
        command = 'javac ' + path;
      }
      exec(command, function(err, stdout, stderr) {
        callback((err || stderr) ? 'Compile time error' : false);
      });
    }
  });
}

Tester.prototype.testOne = function(
    submissionID, judgeInput, language, callback) {
      var filename = 's' + submissionID;
      var fullname = this.SUBMISSION_DIRECTORY + filename;
      var path = fullname + getExtension(language);
      var command = 'timeout 3s echo "' + judgeInput.input + '" | ' +
        'sudo -u nobody ';
      if (language === 'C++') {
        command += './' + fullname + '.o';
      } else if (language === 'Java') {
        command += 'java ' + filename;
      } else if (language === 'Python') {
        command += 'python ' + path;
      }
      if (language === 'Java') {
        command = 'cd ' + this.SUBMISSION_DIRECTORY + '; ' + command + '; cd - > /dev/null';
      }
      exec(command, function(err, stdout, stderr) {
        if (err) {
          callback('Error in running program');
        } else if (stderr) {
          callback('Runtime error');
        } else if (stdout.trim() != String(judgeInput.expected).trim()) {
          callback('Incorrect output');
        } else {
          callback();
        }
      });
    }

Tester.prototype.test = function(
    submissionID, judgeInputs, language, callback) {
      var counter = judgeInputs.length;
      var callbacked = false;
      for (var i = 0; i < judgeInputs.length; i++) {
        if (judgeInputs[i]) {
          this.testOne(submissionID, judgeInputs[i], language, function(err) {
            if (!callbacked) {
              if (err) {
                callback(err);
                callbacked = true;
              } else if (--counter == 0) {
                callback();
              }
            }
          });
        } else {
          counter--;
        }
      }
    }

module.exports.Tester = Tester;
