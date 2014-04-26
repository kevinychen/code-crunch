/**
 * Judge API
 *
 * A Judge requires the following components:
 *
 *   A model, specifying how the judge will obtain the judge input data,
 *     store the submission files, and update the database.
 *   A tester, specifying how to test a submission against a judge input.
 *
 * The model requires the following API functions:
 *
 *   isRunning(): callback with a single boolean value stating whether
 *     the contest is running.
 *   getProblem(problemID): given the problem ID, callback with an error
 *     code and the entire Problem object.
 *   assignSubmissionID(user, problem): assigns a new submission ID (any
 *     distinct ID), callback with an error code and the ID of the submission.
 *   getJudgeInputs(problem): given the problem, callback with an error
 *     code and a list of JudgeInput objects.
 *   solveProblem(user, problem): solves the given problem, and updates
 *     the database, callback with an error code.
 *
 * The tester requires the following API functions:
 *
 *   prepare(submissionID, language, data): prepares the submission stored
 *     as a string in data, including compiling the code, callback with an
 *     error code.
 *   test(submissionID, judgeInputs): tests the given submission against the
 *     judgeInputs, callback with an error code.
 */

var model = require('./model');
var Tester = require('./tester').Tester;
var tester = new Tester('submissions/');

function Judge() {
}

/*
 * params contains:
 *   user: the User object
 *   problemId: the problem id
 *   data: contents of submitted file
 *   language: language of submitted file
 */
exports.judge = function(params, callback) {
  var checkRunning = function() {
    model.isRunning(function(isRunning) {
      if (!isRunning) {
        callback('Content has stopped.');
      } else {
        getProblem();
      }
    });
  }, getProblem = function() {
    model.getProblem(params.problemId, function(err, problem) {
      if (err || !problem) {
        callback('Error obtaining problem ' + problem.name);
      } else {
        params.problem = problem;
        getSubmissionID();
      }
    });
  }, getSubmissionID = function() {
    model.assignSubmissionID(params.user, params.problem,
        function(err, submissionID) {
          if (err) {
            callback('Error incrementing submission counter');
          } else {
            params.submissionID = submissionID;
            preprocess();
          }
        });
  }, preprocess = function() {
    model.process(params, function(err) {
      if (err) {
        callback(err);
      } else {
        prepare();
      }
    });
  }, prepare = function() {
    tester.prepare(params.submissionID, params.language,
        params.data, function(err) {
          if (err) {
            callback(err);
          } else {
            getJudgeInputs();
          }
        });
  }, getJudgeInputs = function() {
    model.getJudgeInputs(params.problem, function(err, judgeInputs) {
      if (err || !judgeInputs) {
        callback('Error obtaining judge inputs');
      } else {
        params.judgeInputs = judgeInputs;
        judgeSubmission();
      }
    });
  }, judgeSubmission = function() {
    tester.test(params.submissionID, params.judgeInputs,
        params.language, function(err) {
          if (err) {
            callback(err);
          } else {
            solveProblem();
          }
        });
  }, solveProblem = function(err) {
    model.solveProblem(params.user, params.problem, function(err) {
      if (err) {
        callback('Error with updating database');
      } else {
        callback();
      }
    });
  };
  checkRunning();
}
