'use strict';

const chalk = require('chalk');
const inquirer = require('inquirer');
const Promise = require('bluebird');
const JiraConnector = require('jira-connector');

/* eslint-disable no-console */

function jira(answers, scope, command, options) {
    const connectorOpts = Object.assign({
        host: answers.jiraHost,
        protocol: answers.jiraProtocol
    }, answers._authentication ? {
        basic_auth: {
            username: answers.jiraUsername,
            password: answers.jiraPassword
        }
    } : {});
    const connector = new JiraConnector(connectorOpts);

    return new Promise(function (resolve, reject) {
        // The callback parameters of jira-connect are all funky, we can't use Promise.fromCallback properly :(
        connector[scope][command](options || {}, function (error, data, response) {
            if (!error) {
                return resolve(data);
            }

            const message = response ? `request failed with status code ${response.statusCode}` : error.message;
            reject(new Error(`Error accessing Jira server: ${message}`));
        });
    }).timeout(10000, `Request to Jira server timed out after 10 seconds`);
}

console.log();
console.log(chalk.yellow(`Welcome to the jira-todo configuration tool`));
console.log(chalk.yellow('-------------------------------------------'));
console.log();
console.log(
    'This tool will contact the Jira server multiple times during the configuration process to retrieve data. ' +
    'Please be patient.'
);
console.log();

inquirer
    .prompt([
        {
            message: 'Please enter the hostname of your Jira server (without "http", e.g. "acme.atlassian.net"):',
            name: 'jiraHost',
            type: 'string'
        },
        {
            message: 'What protocol do you want to use?',
            name: 'jiraProtocol',
            type: 'list',
            choices: ['https', 'http'],
            default: 'https'
        },
        {
            message: 'What is the port of your Jira server?',
            name: 'jiraPort',
            type: 'string',
            default(answers) {
                return answers.jiraProtocol === 'https' ? 443 : 80;
            }
        },
        {
            message: 'Does your Jira server require authentication?',
            name: '_authentication',
            type: 'confirm',
            default: true
        },
        {
            message: 'Please enter your Jira username:',
            name: 'jiraUsername',
            type: 'string',
            when(answers) {
                return answers._authentication;
            }
        },
        {
            message: 'Please enter your Jira password:',
            name: 'jiraPassword',
            type: 'password',
            when(answers) {
                return answers._authentication;
            },
            validate(password, answers) {
                const options = Object.assign({}, answers, { jiraPassword: password });
                return jira(options, 'myPermissions', 'getMyPermissions').return(true);
            }
        },
        {
            message: 'Unless explicitly listed, all projects should be...',
            name: 'projectsDefault',
            type: 'list',
            choices: ['included', 'excluded'],
            default: 'excluded'
        },
        {
            message(answers) {
                return `Select projects to explicitly ` +
                    `${answers.projectsDefault === 'excluded' ? 'allow' : 'forbid'}:`;
            },
            name: 'projectsFilter',
            type: 'checkbox',
            choices(answers) {
                return jira(answers, 'project', 'getAllProjects')
                    .map(project => `${project.key} (${project.name})`);
            },
            filter(input) {
                return input.map(string => string.split(' ', 1)[0]);
            }
        },
        {
            message: 'Unless explicitly listed, all issue status should be...',
            name: 'issueStatusDefault',
            type: 'list',
            choices: ['included', 'excluded'],
            default: 'excluded'
        },
        {
            message(answers) {
                return `Select status to explicitly ` +
                    `${answers.issueStatusDefault === 'excluded' ? 'allow' : 'forbid'}:`;
            },
            name: 'issueStatusFilter',
            type: 'checkbox',
            choices(answers) {
                return jira(answers, 'status', 'getAllStatuses')
                    .map(status => `${status.id} (${status.name})`);
            },
            filter(input) {
                return input.map(string => parseInt(string.split(' ', 1)[0], 10));
            }
        },
        {
            message: 'Unless explicitly listed, all issue types should be...',
            name: 'issueTypesDefault',
            type: 'list',
            choices: ['included', 'excluded'],
            default: 'excluded'
        },
        {
            message(answers) {
                return `Select status to explicitly ` +
                    `${answers.issueTypesDefault === 'excluded' ? 'allow' : 'forbid'}:`;
            },
            name: 'issueTypesFilter',
            type: 'checkbox',
            choices(answers) {
                return jira(answers, 'issueType', 'getAllIssueTypes')
                    .map(type => `${type.id} (${type.name})`);
            },
            filter(input) {
                return input.map(string => parseInt(string.split(' ', 1)[0], 10));
            }
        },
        {
            name: 'keyword',
            message: 'List all keywords that should be considered "todo"s (separated by space):',
            type: 'string',
            default: 'todo fixme',
            filter(input) {
                return input.trim().split(/\s+/);
            }
        },
        {
            name: 'allowTodosWithoutIssues',
            message: 'Should todos without issues be allowed?',
            type: 'confirm',
            default: false
        },
        {
            name: 'withModules',
            message: 'Do you want to include "node_modules" directories?',
            type: 'confirm',
            default: false
        },
        {
            name: '_writeToFile',
            message: 'Do you want to write the output to a file instead of stdout?',
            type: 'confirm',
            default: true
        },
        {
            name: 'format',
            message: 'Chose an output format:',
            type: 'list',
            choices: ['json', 'checkstyle (XML)', 'text (human-readable)'],
            default(answers) {
                return answers._writeToFile ? 'checkstyle (XML)' : 'text (human-readable)';
            },
            filter(input) {
                return input.split(' ', 1)[0];
            }
        },
        {
            name: 'output',
            message: 'Enter the name of the output file:',
            type: 'string',
            when(answers) {
                return answers._writeToFile;
            },
            default(answers) {
                return {
                    checkstyle: 'todos.xml',
                    json: 'todos.json',
                    text: 'todos.txt'
                }[answers.format];
            }
        },
        {
            name: 'logFormat',
            message: 'What format should the log output have?',
            type: 'list',
            choices: ['null (no logging)', 'short', 'long', 'simple', 'json', 'bunyan'],
            default: 'null (no logging)',
            filter(input) {
                return input.split(' ', 1)[0];
            }
        },
        {
            name: 'verbose',
            message: 'Do you want more verbose log output?',
            type: 'confirm',
            default: true,
            when(answers) {
                return answers.logFormat !== 'null';
            }
        },
        {
            name: '_savePassword',
            message: 'Do you want to store your Jira password (not recommended)?',
            type: 'confirm',
            default: false
        }
    ])
    .then(function (answers) {
        delete answers._writeToFile;

        if (!answers._savePassword) {
            delete answers.jiraPassword;
        }
        delete answers._savePassword;

        if (!answers._authentication) {
            delete answers.jiraUsername;
            delete answers.jiraPassword;
        }
        delete answers._authentication;

        console.log();
        console.log(chalk.cyan(
            'All done! Copy and paste this to your jira-todo config file or include it in your package.json under ' +
            'the "jira-todo" property:'
        ));
        console.log();
        console.log(JSON.stringify(answers, null, 4));
    });
