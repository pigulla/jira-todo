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
 * @param {Bunyan} logger
 * @return {Promise}
 */
module.exports = function cliRunner(glob, jt, formatter, logger) {
    let errorCount = 0;
    let fileCount = 0;
    
    return new Promise(function (resolve, reject) {
        function drained() {
            formatter.end();
            resolve(errorCount);
        }

        function stop(err, file) {
            const error = file ? new Error(`Could not process file "${file}" (${err.message})`) : err;
            logger.error(error);

            queue.kill();
            glob.abort();
            reject(err);
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
            if (fileCount === 0) {
                logger.warn('No files processed');
                drained();
            } else {
                queue.drain = drained;
            }
        });
    });
};