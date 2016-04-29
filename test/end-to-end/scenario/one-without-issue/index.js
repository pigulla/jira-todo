'use strict';

module.exports.setup = {};
module.exports.result = {};

module.exports.setup.argv = [
    '--monochrome',
    '--logFormat', 'json',
    '--jiraHost', 'localhost',
    '--jiraProtocol', 'http',
    '--jiraUsername', 'myuser',
    '--jiraPassword', 'mypass',
    '--jiraPort', '8080'
];

module.exports.setup.env = {
};

module.exports.result.logs = [
    {
        level: 'WARN',
        msg: 'Problem found for issue FOO-42 in comment starting in line 4: Issue was not found',
        filename: 'my-file.js'
    },
    { 
        level: 'ERROR',
        msg: '1 problem found in 1 file'
    }
];

module.exports.result.report = [
    {
        file: 'my-file.js',
        errors: [
            {
                issue: 'FOO-42',
                message: 'Issue was not found',
                line: 4,
                column: 4
            }
        ]
    }
];

module.exports.result.exitCode = 1;