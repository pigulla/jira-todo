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
    'quiet': {
        type: 'boolean',
        describe: 'Do not output any log messages at all',
        default: false
    },
    'logFormat': {
        type: 'string',
        requiresArg: true,
        describe: 'Format of the log output',
        choices: ['text', 'json'],
        default: 'text'
    },
    'monochrome': {
        type: 'boolean',
        describe: 'Disable color in log messages (ignored if format is "text")',
        default: false
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
        describe: 'Do not automatically add "node_modules/**/*" to the list of ignored patterns',
        default: false
    },
    'format': {
        type: 'string',
        requiresArg: true,
        describe: 'The output format',
        choices: Object.keys(formatters),
        default: 'json'
    },
    'output': {
        type: 'string',
        requiresArg: true,
        describe: 'The output file to write to'
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
        required: true,
        requiresArg: true,
        describe: 'The username for the Jira account to use'
    },
    'jiraPassword': {
        type: 'string',
        required: true,
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
    .help('help').describe('help', 'Display this help message')
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
        'JT_JIRA_USERNAME=groot JT_JIRA_PASSWORD=mypass $0 --jiraHost jira.example.com --projectsFilter FOO --projectsFilter BAR',
        'Process all .js files in the current directory recursively allowing only issues from the projects FOO and BAR. ' +
        'All issue types and status are accepted. The Jira username and password are provided via environment variables'
    )
    .options(OPTIONS)
    .group([
        'directory', 'pattern', 'ignore', 'dot', 'withModules', 'keyword', 'config'
    ], 'General configuration')
    .group([
        'output', 'format', 'quiet', 'verbose', 'monochrome'
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
    .pkgConf('jira-todo', process.cwd())
    .config('config', path => JSON.parse(fs.readFileSync(path)))
    .check(function (argv, options) {
        parseToIntegers(argv.issueTypesFilter, 'issueTypeFilter');
        parseToIntegers(argv.issueStatusFilter, 'issueStatusFilter');
        return true;
    })
    .strict();