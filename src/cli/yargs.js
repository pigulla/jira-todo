'use strict';

const fs = require('fs');

const yargs = require('yargs');

const pkg = require('../../package.json');
const formatters = require('../formatter/');

const OPTIONS = {
    'verbose': {
        count: true,
        describe: 'Increase logging verbosity (can be specified multiple times)'
    },
    'logFormat': {
        type: 'string',
        requiresArg: true,
        describe: 'Format of the log output',
        choices: ['short', 'long', 'simple', 'json', 'bunyan', 'null'],
        default: 'null'
    },
    'monochrome': {
        type: 'boolean',
        describe: 'Disable colors in all output written to the console',
        default: false
    },
    'warnOnly': {
        type: 'boolean',
        default: false,
        describe: 'Always exit with code 0 even if problems were found (unless an error occurred)'
    },
    'directory': {
        type: 'string',
        default: process.cwd(),
        defaultDescription: 'Current directory',
        requiresArg: true,
        describe: 'Path to the base directory'
    },
    'keyword': {
        type: 'string',
        array: true,
        default: ['todo', 'fixme'],
        requiresArg: true,
        describe: 'Keywords that trigger the "todo"-check (case insensitive, can be specified multiple times)'
    },
    'pattern': {
        type: 'string',
        default: '**/*.js',
        requiresArg: true,
        describe: 'Glob pattern of files to process'
    },
    'ignore': {
        type: 'string',
        array: true,
        requiresArg: true,
        describe: 'Glob pattern of files to ignore (can be specified multiple times)'
    },
    'dot': {
        type: 'boolean',
        describe: 'Treat dots as normal characters (otherwise they are ignored by default)',
        default: false
    },
    'withModules': {
        type: 'boolean',
        describe: 'Do not automatically add all "node_modules" directories to the list of ignored patterns',
        default: false
    },
    'format': {
        type: 'string',
        requiresArg: true,
        describe: 'The output format',
        choices: Object.keys(formatters),
        default: 'text'
    },
    'includeValid': {
        type: 'boolean',
        describe: 'Include valid issues in output',
        default: false
    },
    'output': {
        type: 'string',
        requiresArg: true,
        describe: 'The output file to write to (if not given, stdout is used)'
    },
    'jiraHost': {
        type: 'string',
        required: true,
        requiresArg: true,
        describe: 'Hostname of the Jira server (without "http://")'
    },
    'jiraPort': {
        type: 'number',
        requiresArg: true,
        describe: 'Port of the Jira server',
        default: null,
        defaultDescription: '443 for HTTPS, 80 for HTTP'
    },
    'jiraProtocol': {
        type: 'string',
        requiresArg: true,
        describe: 'Protocol of the Jira server',
        choices: ['http', 'https'],
        default: 'https'
    },
    'jiraUsername': {
        type: 'string',
        requiresArg: true,
        describe: 'The username for the Jira account to use'
    },
    'jiraPassword': {
        type: 'string',
        requiresArg: true,
        describe: 'The password for the Jira account to use'
    },
    'allowTodosWithoutIssues': {
        type: 'boolean',
        describe: 'Allow todos which are not referencing any issues',
        default: false
    },
    'projectsDefault': {
        type: 'string',
        requiresArg: true,
        describe: 'How to handle projects not explicitly filtered',
        choices: ['excluded', 'included'],
        default: 'excluded'
    },
    'projectsFilter': {
        type: 'string',
        array: true,
        requiresArg: true,
        describe: 'White- or blacklist of projects (depending on the "projectsDefault" setting)'
    },
    'issueTypesDefault': {
        type: 'string',
        requiresArg: true,
        describe: 'How to handle issue types not explicitly filtered',
        choices: ['excluded', 'included'],
        default: 'included'
    },
    'issueTypesFilter': {
        type: 'string',
        array: true,
        requiresArg: true,
        describe: 'White- or blacklist of issue types (depending on the "issueTypesDefault" setting)'
    },
    'issueStatusDefault': {
        type: 'string',
        requiresArg: true,
        describe: 'How to handle issue status not explicitly filtered',
        choices: ['excluded', 'included'],
        default: 'included'
    },
    'ecmaVersion': {
        type: 'number',
        requiresArg: true,
        describe: 'Supported ECMAScript version',
        choices: [3, 5, 6, 7, 8],
        default: 6
    },
    'sourceType': {
        type: 'string',
        requiresArg: true,
        describe: 'Type of script to be parsed',
        choices: ['script', 'module'],
        default: 'script'
    },
    'impliedStrict': {
        type: 'boolean',
        describe: 'Enable implied strict mode (if ecmaVersion >= 5)',
        default: false
    },
    'globalReturn': {
        type: 'boolean',
        describe: 'Enable return in global scope',
        default: false
    },
    'jsx': {
        type: 'boolean',
        describe: 'Enable JSX parsing',
        default: false
    },
    'experimentalObjectRestSpread': {
        type: 'boolean',
        describe: 'Allow experimental object rest/spread',
        default: false
    },
    'issueStatusFilter': {
        type: 'string',
        array: true,
        requiresArg: true,
        describe: 'White- or blacklist of issue status (depending on the "issueStatusDefault" setting)'
    }
};

/**
 * @param {?Array.<string>} array
 * @param {string} name
 */
function parseToIntegers(array, name) {
    if (array) {
        array.forEach(function (value, index) {
            if (!/^\d+$/.test(value)) {
                throw new Error(`${name} "${value}" is not an integer`);
            }
            array[index] = parseInt(value, 10);
        });
    }
}

/* eslint-disable max-len */
module.exports = yargs
    .help('help').describe('help', 'Display basic usage information')
    .env('JT')
    .detectLocale(false)
    .wrap(yargs.terminalWidth())
    .version()
    .usage(`${pkg.name} v${pkg.version}, (c) ${pkg.author.name} <${pkg.author.email}>`)
    .epilog(`For more information visit the project's homepage at ${pkg.homepage}`)
    .example(
        '$0 --config .jtrc.json',
        'Read the entire config from the given config file, including the Jira password (generally not a good idea)'
    )
    .example(
        'JT_JIRA_USERNAME=groot JT_JIRA_PASSWORD=mypass $0 --pattern **/*.\\{js,jsx\\} --jiraHost jira.example.com --projectsFilter FOO --projectsFilter BAR',
        'Process all .js and .jsx files in the current directory recursively allowing only issues from the projects FOO and BAR. ' +
        'All issue types and status are accepted. The Jira username and password are provided via environment variables'
    )
    .options(OPTIONS)
    .group([
        'directory', 'pattern', 'ignore', 'dot', 'withModules', 'keyword', 'config', 'warnOnly'
    ], 'General configuration')
    .group([
        'sourceType', 'ecmaVersion', 'jsx', 'globalReturn', 'impliedStrict', 'experimentalObjectRestSpread'
    ], 'Parser configuration')
    .group([
        'output', 'format', 'includeValid', 'logFormat', 'verbose', 'monochrome'
    ], 'Logging and output')
    .group([
        'jiraHost', 'jiraProtocol', 'jiraPort', 'jiraUsername', 'jiraPassword'
    ], 'Jira settings')
    .group([
        'projectsDefault', 'projectsFilter', 'issueTypesDefault', 'issueTypesFilter',
        'issueStatusDefault', 'issueStatusFilter', 'allowTodosWithoutIssues'
    ], 'Issue handling')
    .group([
        'help', 'version'
    ], 'Other options')
    .implies('jiraUsername', 'jiraPassword')
    .implies('jiraPassword', 'jiraUsername')
    .pkgConf('jira-todo', process.cwd())
    .config('config', path => JSON.parse(fs.readFileSync(path)))
    .check(function (argv, options) {
        argv.ecmaVersion = parseInt(argv.ecmaVersion, 10);
        parseToIntegers(argv.issueTypesFilter, 'issueTypeFilter');
        parseToIntegers(argv.issueStatusFilter, 'issueStatusFilter');

        if (argv.verbose && argv.logFormat === 'null') {
            throw new Error('The "verbose" flag requires a logFormat other than "null".');
        }
        return true;
    })
    .strict();
