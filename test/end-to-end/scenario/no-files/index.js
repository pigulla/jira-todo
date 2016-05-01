'use strict';

module.exports.setup = {};
module.exports.result = {};

module.exports.setup.argv = [
    '--monochrome',
    '--format', 'json',
    '--logFormat', 'json',
    '--pattern', '*.js',
    '--jiraHost', 'localhost',
    '--jiraUsername', 'myuser',
    '--jiraPassword', 'mypass',
    '--jiraPort', '1337'
];

module.exports.setup.env = {
};

module.exports.result.logs = [
    { level: 'WARN', msg: 'No files processed' }
];

module.exports.result.report = [];

module.exports.result.exitCode = 0;