'use strict';

const fs = require('fs');
const path = require('path');

const pkg = require('../../package.json');

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
 * @enum {number}
 */
const EXIT_CODE = {
    OK: 0,
    PROBLEMS_FOUND: 1,
    INTERNAL_ERROR: 2
};

/**
 * @param {Object} proc
 * @param {Array.<string>} proc.argv
 * @param {stream.Writable} proc.stdout
 * @param {stream.Writable} proc.stderr
 * @return {Promise.<number>}
 */
module.exports = function (proc) {
    const argv = cliYargs.parse(proc.argv);

    const SILENT = argv.logFormat === 'null';
    const VERBOSITY = Math.min(argv.verbose, 3);
    const LEVEL = { 3: bunyan.TRACE, 2: bunyan.DEBUG, 1: bunyan.INFO, 0: bunyan.WARN }[VERBOSITY];

    const directory = path.resolve(argv.directory);
    const outFile = argv.output ? path.resolve(argv.output) : null;
    const outStream = outFile ? fs.createWriteStream(outFile) : proc.stdout;
    const formatter = new formatters[argv.format](outStream, argv.monochrome);
    const defaultIgnores = argv.withModules ? [] : ['**/node_modules/**/*'];
    const logStream = SILENT ?
        blackhole() :
        bformat({ outputMode: argv.logFormat, levelInString: true, color: !argv.monochrome }, proc.stderr);
    const logger = bunyan.createLogger({
        name: pkg.name,
        LEVEL,
        stream: logStream
    });

    function closeStream() {
        if (!outFile) {
            // stdout can't be closed
            return Promise.resolve();
        }

        return Promise.fromCallback(cb => outStream.end(cb));
    }

    const glob = new Glob(argv.pattern, {
        cwd: directory,
        nosort: true,
        dot: argv.dot,
        ignore: defaultIgnores.concat(argv.ignore || [])
    });
    const connectorConfig = {
        host: argv.jiraHost,
        protocol: argv.jiraProtocol,
        port: argv.jiraPort ? argv.jiraPort : (argv.jiraProtocol === 'https' ? 443 : 80)
    };
    
    if (argv.jiraUsername) {
        connectorConfig.basic_auth = {
            username: argv.jiraUsername,
            password: argv.jiraPassword
        };
    }

    const jt = new JiraTodo({
        logger,
        allowTodosWithoutIssues: argv.allowTodosWithoutIssues,
        processor: {
            keywords: argv.keyword,
            connector: connectorConfig,
            parserOptions: {
                sourceType: argv.sourceType,
                ecmaVersion: argv.ecmaVersion,
                ecmaFeatures: {
                    jsx: argv.jsx,
                    globalReturn: argv.globalReturn,
                    impliedStrict: argv.impliedStrict,
                    experimentalObjectRestSpread: argv.experimentalObjectRestSpread
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

    return runner(glob, jt, formatter)
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
                return EXIT_CODE.PROBLEMS_FOUND;
            } else {
                logger.info(`All files are OK`);
                return EXIT_CODE.OK;
            }
        })
        .then(exitCode => argv.warnOnly ? 0 : exitCode)
        .catch(function (error) {
            if (SILENT) {
                proc.stderr.write(`An error occurred: ${error.message}.`);
            } else {
                logger.error(error);
            }
            return closeStream().return(EXIT_CODE.INTERNAL_ERROR);
        });
};