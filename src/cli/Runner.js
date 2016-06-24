'use strict';

const fs = require('fs');
const path = require('path');

const queue = require('async/queue');
const Promise = require('bluebird');

const CONCURRENCY = 5;

/**
 * @param {Glob} glob
 * @param {jt.JiraTodo} jt
 * @param {jt.Formatter} formatter
 * @return {Promise.<{ files: number, errors: number }>}
 */
module.exports = function cliRunner(glob, jt, formatter) {
    let errorCount = 0;
    let fileCount = 0;
    let tasks;

    return new Promise(function (resolve, reject) {
        /* eslint-disable require-jsdoc */
        function drained() {
            formatter.end();
            resolve({
                files: fileCount,
                errors: errorCount
            });
        }

        function stop(err, file) {
            const error = file ? new Error(`Could not process file "${file}" (${err.message})`) : err;

            tasks.kill();
            glob.abort();
            reject(error);
        }

        function worker(match, callback) {
            const file = path.resolve(glob.cwd, match);

            Promise
                .fromCallback(cb => fs.readFile(file, cb))
                .then(buffer => buffer.toString())
                .then(source => jt.run(source, match, formatter))
                .then(reports => (errorCount += reports.filter(report => !report.valid).length))
                .catch(error => stop(error, file))
                .finally(callback);
        }
        /* eslint-enable require-jsdoc */

        tasks = queue(worker, CONCURRENCY);

        formatter.start();

        glob.on('error', stop);
        glob.on('match', function (match) {
            fileCount++;
            tasks.push(match);
        });
        glob.on('end', function () {
            if (tasks.idle()) {
                drained();
            } else {
                tasks.drain = drained;
            }
        });
    });
};
