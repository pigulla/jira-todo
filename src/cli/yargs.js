'use strict';

const fs = require('fs');
const yargs = require('yargs');
const formatters = require('../formatter/');

const OPTIONS = {
    'verbose': {
        count: true,
        describe: 'Increase logging verbosity'
    },
    'log': {
        type: 'boolean',
        describe: 'Disable logging',
        default: false
    },
    'directory': {
        type: 'string',
        default: process.cwd(),
        requiresArg: true,
        describe: 'The path to the base directory'
    },
    'pattern': {
        type: 'string',
        default: '**/*.js',
        requiresArg: true,
        describe: 'Glob pattern'
    },
    'ignore': {
        type: 'string',
        array: true,
        default: ['node_modules/**/*'],
        requiresArg: true,
        describe: 'Ignore patterns'
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
        describe: 'Hostname of the Jira server'
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
        describe: 'Username of the Jira server'
    },
    'jiraPassword': {
        type: 'string',
        required: true,
        requiresArg: true,
        describe: 'Password for the Jira server'
    },
    'projectsDefault': {
        type: 'string',
        required: true,
        requiresArg: true,
        describe: 'Default value',
        choices: ['excluded', 'included'],
        default: 'included'
    },
    'projectsFilter': {
        type: 'string',
        array: true,
        requiresArg: true,
        describe: 'Filter'
    },
    'issueTypesDefault': {
        type: 'string',
        required: true,
        requiresArg: true,
        describe: 'Default value',
        choices: ['excluded', 'included'],
        default: 'included'
    },
    'issueTypesFilter': {
        type: 'string',
        array: true,
        requiresArg: true,
        describe: 'Filter'
    },
    'issueStatusDefault': {
        type: 'string',
        required: true,
        requiresArg: true,
        describe: 'Default value',
        choices: ['excluded', 'included'],
        default: 'included'
    },
    'issueStatusFilter': {
        type: 'string',
        array: true,
        requiresArg: true,
        describe: 'Filter'
    }
};

module.exports = yargs
    .help('help').describe('help', 'Display this help message')
    .env('JTC')
    .detectLocale(false)
    .options(OPTIONS)
    .config('config', path => JSON.parse(fs.readFileSync(path)))
    .implies('verbose', 'log')
    .strict();