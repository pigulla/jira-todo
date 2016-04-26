'use strict';

const inquirer = require('inquirer');
const fs = require('fs');
const Promise = require('bluebird');
const JiraConnector = require('jira-connector');

function jira(answers, scope, command, options) {
    const connector = new JiraConnector({
        host: answers.jiraHost,
        protocol: answers.jiraProtocol,
        basic_auth: {
            username: answers.jiraUsername,
            password: answers.jiraPassword
        }
    });

    return new Promise(function (resolve, reject) {
        // The callback parameters of jira-connect are all funky, we can't use Promise.fromCallback properly :(
        connector[scope][command](options || {}, function (error, data, response) {
            if (!error) {
                return resolve(data);
            }

            const message = response ? `request failed with status code ${response.statusCode}` : error.message;
            reject(new Error(`Error accessing Jira server: ${message}`));
        });
    }).timeout(5000, `Request to Jira server timed out after 5 seconds`);
}

inquirer
    .prompt([
        {
            message: 'Jira host',
            name: 'jiraHost',
            type: 'string'
        },
        {
            message: 'Jira protocol',
            name: 'jiraProtocol',
            type: 'list',
            choices: ['https', 'http'],
            default: 'https'
        },
        {
            message: 'Jira Username',
            name: 'jiraUsername',
            type: 'string'
        },
        {
            message: 'Password',
            name: 'jiraPassword',
            type: 'password',
            validate(password, answers) {
                const options = Object.assign({}, answers, { jiraPassword: password });

                return jira(options, 'myPermissions', 'getMyPermissions').return(true);
            }
        },
        {
            message: 'Default project behaviour',
            name: 'projectsDefault',
            type: 'list',
            choices: ['included', 'excluded'],
            default: 'excluded'
        },
        {
            message(answers) {
                return `Select projects to explicitly ` +
                    `${answers.projectsDefault === 'excluded' ? 'include' : 'exclude'}:`;
            },
            name: 'projectsFilter',
            type: 'checkbox',
            choices(answers) {
                return jira(answers, 'project', 'getAllProjects')
                    .map(project => `${project.key} (${project.name})`);
            },
            filter(input) {
                return Promise.resolve(input.map(string => string.split(' ', 1)[0]));
            }
        },
        {
            message: 'Default status behaviour',
            name: 'issueStatusDefault',
            type: 'list',
            choices: ['included', 'excluded'],
            default: 'excluded'
        },
        {
            message(answers) {
                return `Select status to explicitly ` +
                    `${answers.issueStatusDefault === 'excluded' ? 'include' : 'exclude'}:`;
            },
            name: 'issueStatusFilter',
            type: 'checkbox',
            choices(answers) {
                return jira(answers, 'status', 'getAllStatuses')
                    .map(status => `${status.id} (${status.name})`);
            },
            filter(input) {
                return Promise.resolve(input.map(string => parseInt(string.split(' ', 1)[0], 10)));
            }
        },
        {
            message: 'Default issue type behaviour',
            name: 'issueTypesDefault',
            type: 'list',
            choices: ['included', 'excluded'],
            default: 'excluded'
        },
        {
            message(answers) {
                return `Select status to explicitly ` +
                    `${answers.issueTypesDefault === 'excluded' ? 'include' : 'exclude'}:`;
            },
            name: 'issueTypesFilter',
            type: 'checkbox',
            choices(answers) {
                return jira(answers, 'issueType', 'getAllIssueTypes')
                    .map(type => `${type.id} (${type.name})`);
            },
            filter(input) {
                return Promise.resolve(input.map(string => parseInt(string.split(' ', 1)[0], 10)));
            }
        },
        {
            name: 'allowTodosWithoutIssues',
            message: 'Allow todos without issues?',
            type: 'confirm',
            default: false
        },
        {
            name: 'ignoreNodeModules',
            message: 'Add node_modules folder to ignore list?',
            type: 'confirm',
            default: true
        },
        {
            name: 'writeToFile',
            message: 'Do you want to write the output to a file instead of stdout?',
            type: 'confirm',
            default: true
        },
        {
            name: 'format',
            message: 'Output format',
            type: 'list',
            choices(answers) {
                return ['json', 'checkstyle'].concat(answers.writeToFile ? [] : ['null']);
            },
            default(answers) {
                return answers.writeToFile ? 'json' : 'null';
            }
        },
        {
            name: 'output',
            message: 'Enter the name of the output file:',
            type: 'string',
            when(answers) {
                return answers.writeToFile;
            },
            default(answers) {
                return {
                    checkstyle: 'todos.xml',
                    json: 'todos.json'
                }[answers.format];
            }
        },
        {
            name: 'quiet',
            message: 'Do you want to disable log output?',
            type: 'confirm',
            default: false
        },
        {
            name: 'verbose',
            message: 'Do you want more verbose log output?',
            type: 'confirm',
            default: true,
            when(answers) {
                return !answers.quiet;
            }
        },
        {
            name: 'savePassword',
            message: 'Do you want to store the password (not recommended)?',
            type: 'confirm',
            default: false
        },
        {
            name: 'outfile',
            message: 'Enter the name of the target configuration file:',
            type: 'string',
            default: '.jtrc.json'
        }
    ])
    .then(function (answers) {
        const outfile = answers.outfile;

        answers.ignore = answers.ignoreNodeModules ? ['node_modules/**/*'] : [];
        delete answers.writeToFile;
        delete answers.ignoreNodeModules;
        delete answers.action;
        delete answers.outfile;

        if (!answers.savePassword) {
            delete answers.jiraPassword;
        }
        delete answers.savePassword;

        return Promise.fromCallback(cb => fs.writeFile(outfile, JSON.stringify(answers, null, 4), cb));
    });
