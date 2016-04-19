'use strict';

const fs = require('fs');
const path = require('path');

const Promise = require('bluebird');
const Glob = require('glob').Glob;
const bunyan = require('bunyan');
const bformat = require('bunyan-format');
const blackhole = require('stream-blackhole');

const runner = require('./Runner');
const JiraTodo = require('../JiraTodo');
const formatters = require('../formatter/');

const argv = require('./yargs').argv;
const verbosity = Math.min(argv.verbose, 3);
const level = { 3: bunyan.TRACE, 2: bunyan.DEBUG, 1: bunyan.INFO, 0: bunyan.WARN }[verbosity];

const logger = bunyan.createLogger({
    name: 'default',
    level,
    stream: bformat({ outputMode: 'short' }, argv.log ? process.stdout : blackhole())
});

const directory = path.resolve(argv.directory);
const outFile = argv.output ? path.resolve(argv.output) : null;
const outStream = outFile ? fs.createWriteStream(outFile) : process.stdout;
const formatter = new formatters[argv.format](outStream);
const closeStream = () => outFile ? outStream.end() : null;

console.dir(argv)

const glob = new Glob(argv.pattern, {
    cwd: directory,
    nosort: true,
    ignore: argv.ignore
});
const jt = new JiraTodo({
    logger,
    processor: {
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

runner(glob, jt, formatter, logger)
    .then(function (errorCount) {
        closeStream();

        if (errorCount > 0) {
            logger.error(`${errorCount} problem${errorCount > 1 ? 's' : ''} found`);
            process.exit(1);
        } else {
            logger.info('All files are OK');
        }
    })
    .catch(function (error) {
        logger.error(error);
        closeStream();
        process.exit(2);
    });
