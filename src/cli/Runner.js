'use strict';

const fs = require('fs');
const path = require('path');

const async = require('async');
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
    
    return new Promise(function (resolve, reject) {
        function drained() {
            formatter.end();
            resolve({ files: fileCount, errors: errorCount });
        }

        function stop(err, file) {
            const error = file ? new Error(`Could not process file "${file}" (${err.message})`) : err;

            queue.kill();
            glob.abort();
            reject(error);
        }

        function worker(match, cb) {
            const file = path.resolve(glob.cwd, match);

            Promise
                .fromCallback(cb => fs.readFile(file, cb))
                .then(buffer => buffer.toString())
                .then(source => jt.run(source, match, formatter))
                .then(errors => errorCount += errors.length)
                .catch(error => stop(error, file))
                .finally(cb);
        }

        const queue = async.queue(worker, CONCURRENCY);
        formatter.start();

        glob.on('error', stop);
        glob.on('match', function (match) {
            fileCount++;
            queue.push(match);
        });
        glob.on('end', function () {
            if (queue.idle()) {
                drained();
            } else {
                queue.drain = drained;
            }
        });
    });
};