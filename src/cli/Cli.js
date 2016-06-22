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
const p = require('../lib/plural');
const cliYargs = require('./yargs');

/**
 * CLI Wrapper Class
 */
class Cli {
    /**
     * @param {Object} proc
     * @param {Array.<string>} proc.argv
     * @param {stream.Writable} proc.stdout
     * @param {stream.Writable} proc.stderr
     */
    constructor(proc) {
        this._argv = cliYargs.parse(proc.argv);
        this._process = proc;

        this._initLogger();
    }

    /**
     * @type {boolean}
     */
    get silent() {
        return this._argv.logFormat === 'null';
    }

    /**
     * @private
     */
    _initLogger() {
        const VERBOSITY = Math.min(this._argv.verbose, 3);
        const LEVEL = {
            3: bunyan.TRACE,
            2: bunyan.DEBUG,
            1: bunyan.INFO,
            0: bunyan.WARN
        }[VERBOSITY];

        const logStream = this.silent ?
            blackhole() :
            bformat({
                outputMode: this._argv.logFormat,
                levelInString: true,
                color: !this._argv.monochrome
            }, this._process.stderr);

        this._logger = bunyan.createLogger({
            name: pkg.name,
            LEVEL,
            stream: logStream
        });
    }

    /**
     * @private
     * @return {jt.JiraTodo}
     */
    _getJiraTodo() {
        const argv = this._argv;

        const defaultPort = argv.jiraProtocol === 'https' ? 443 : 80;
        const connectorConfig = {
            host: argv.jiraHost,
            protocol: argv.jiraProtocol,
            port: argv.jiraPort ? argv.jiraPort : defaultPort
        };

        if (argv.jiraUsername) {
            connectorConfig.basic_auth = {
                username: argv.jiraUsername,
                password: argv.jiraPassword
            };
        }

        return new JiraTodo({
            logger: this._logger,
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
    }

    /**
     * @return {Promise.<number>}
     */
    run() {
        const argv = this._argv;
        const logger = this._logger;
        const directory = path.resolve(argv.directory);
        const defaultIgnores = argv.withModules ? [] : ['**/node_modules/**/*'];
        const outFile = argv.output ? path.resolve(argv.output) : null;
        const outStream = outFile ? fs.createWriteStream(outFile) : this._process.stdout;
        const formatter = new formatters[argv.format](outStream, this._argv.monochrome);
        const glob = new Glob(argv.pattern, {
            cwd: directory,
            nosort: true,
            dot: argv.dot,
            ignore: defaultIgnores.concat(argv.ignore || [])
        });
        const jt = this._getJiraTodo();

        return runner(glob, jt, formatter)
            .bind(this)
            .tap(() => this._closeStream(outStream))
            .then(function (result) {
                logger.debug(`A total of ${result.files} file${p(' was', 's were', result.files)} processed`);

                if (result.files === 0) {
                    logger.warn('No files processed');
                    return 0;
                } else if (result.errors > 0) {
                    logger.error(
                        `${result.errors} problem${p('', 's', result.errors)} found ` +
                        `in ${result.files} file${p('', 's', result.files)}`
                    );
                    return Cli.EXIT_CODE.PROBLEMS_FOUND;
                } else {
                    logger.info('All files are OK');
                    return Cli.EXIT_CODE.OK;
                }
            })
            .then(exitCode => (argv.warnOnly ? 0 : exitCode))
            .catch(function (error) {
                if (this.silent) {
                    this._process.stderr.write(`An error occurred: ${error.message}.`);
                } else {
                    logger.error(error);
                }
                return this._closeStream(outStream).return(Cli.EXIT_CODE.INTERNAL_ERROR);
            });
    }

    /**
     * Close the output stream unless it was stdout.
     *
     * @private
     * @param {?stream.Writable} outStream
     * @return {Promise}
     */
    _closeStream(outStream) {
        if (outStream === this._process.stdout) {
            // stdout can't be closed
            return Promise.resolve();
        }

        return Promise.fromCallback(cb => outStream.end(cb));
    }
}

/**
 * @enum {number}
 */
Cli.EXIT_CODE = {
    OK: 0,
    PROBLEMS_FOUND: 1,
    INTERNAL_ERROR: 2
};

module.exports = Cli;
