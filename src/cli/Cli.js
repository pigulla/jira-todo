'use strict';

const fs = require('fs');
const path = require('path');

const Glob = require('glob').Glob;
const bunyan = require('bunyan');
const Promise = require('bluebird');
const bformat = require('bunyan-format');
const blackhole = require('stream-blackhole');

const runner = require('./Runner');
const JiraTodo = require('../JiraTodo');
const formatters = require('../formatter/');
const cliYargs = require('./yargs');

/**
 * @param {Object} proc
 * @param {Array.<string>} proc.argv
 * @param {stream.Writable} proc.stdout
 * @param {stream.Writable} proc.stderr
 * @return {Promise.<number>}
 */
module.exports = function (proc) {
    const argv = cliYargs.parse(proc.argv);
    const verbosity = Math.min(argv.verbose, 3);
    const level = { 3: bunyan.TRACE, 2: bunyan.DEBUG, 1: bunyan.INFO, 0: bunyan.WARN }[verbosity];

    const logger = bunyan.createLogger({
        name: 'default',
        level,
        stream: bformat({ outputMode: 'short', color: !argv.monochrome }, argv.quiet ? blackhole() : proc.stderr)
    });

    const directory = path.resolve(argv.directory);
    const outFile = argv.output ? path.resolve(argv.output) : null;
    const outStream = outFile ? fs.createWriteStream(outFile) : proc.stderr;
    const formatter = new formatters[argv.format](outStream);

    function closeStream() {
        if (!outFile) {
            // stderr can't be closed
            return Promise.resolve();
        }

        return Promise.fromCallback(cb => outStream.end(cb));
    }

    const glob = new Glob(argv.pattern, {
        cwd: directory,
        nosort: true,
        ignore: argv.ignore
    });
    const jt = new JiraTodo({
        logger,
        allowTodosWithoutIssues: argv.allowTodosWithoutIssues,
        processor: {
            keywords: argv.keyword,
            connector: {
                host: argv.jiraHost,
                protocol: argv.jiraProtocol,
                basic_auth: {
                    username: argv.jiraUsername,
                    password: argv.jiraPassword
                }
            }
        },
        validator: {
            projects: {
                default: argv.projectsDefault,
                filter: argv.projectsFilter || []
            },
            issueTypes: {
                default: argv.issueTypesDefault,
                filter: argv.issueTypesFilter || []
            },
            issueStatus: {
                default: argv.issueStatusDefault,
                filter: argv.issueStatusFilter || []
            }
        }
    });

    return runner(glob, jt, formatter, logger)
        .tap(closeStream)
        .then(function (result) {
            logger.debug(`A total of ${result.files} file${result.files === 1 ? ' was' : 's were'} processed`);

            if (result.files === 0) {
                logger.warn(`No files processed`);
                return 0;
            } else if (result.errors > 0) {
                logger.error(
                    `${result.errors} problem${result.errors > 1 ? 's' : ''} found ` +
                    `in ${result.files} file${result.errors > 1 ? 's' : ''}`
                );
                return 1;
            } else {
                logger.info(`All files are OK`);
                return 0;
            }
        })
        .catch(function (error) {
            logger.error(error);
            return closeStream().return(2);
        });
};