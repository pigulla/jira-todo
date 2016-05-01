'use strict';

module.exports.setup = {};
module.exports.result = {};

module.exports.setup.argv = [
    '--monochrome',
    '--format', 'json',
    '--logFormat', 'json',
    '--pattern', '**/*.{js,jsx}',
    '--jiraHost', 'localhost',
    '--jiraProtocol', 'http',
    '--projectsDefault', 'excluded',
    '--projectsFilter', 'TRANS',
    '--projectsFilter', 'FOO',
    '--issueStatusDefault', 'excluded',
    '--jiraPort', '8080'
];

module.exports.setup.env = {
    JT_JIRA_PASSWORD: 'mypass',
    JT_JIRA_USERNAME: 'myuser'
};

module.exports.result.logs = [
    {
        filename: 'one/service.js',
        level: 'WARN',
        msg: 'Problem found for issue TRANS-1942 in comment starting in line 7: Status "Resolved" (id 5) is not allowed'
    },
    {
        filename: 'one/two/Component.jsx',
        level: 'WARN',
        msg: 'Problem found for issue DEMO-1058 in comment starting in line 4: Project "DEMO" is not allowed'
    },
    {
        filename: 'one/two/Component.jsx',
        level: 'WARN',
        msg: 'Problem found for issue FOO-42 in comment starting in line 7: Issue was not found'
    },
    {
        level: 'ERROR',
        msg: '3 problems found in 2 files'
    }
];

module.exports.result.report = [
    {
        file: 'one/service.js',
        errors: [
            {
                issue: 'TRANS-1942',
                message: 'Status "Resolved" (id 5) is not allowed',
                line: 7,
                column: 4
            }
        ]
    },
    {
        file: 'one/two/Component.jsx',
        errors: [
            {
                issue: 'DEMO-1058',
                message: 'Project "DEMO" is not allowed',
                line: 4,
                column: 4
            },
            {
                column: 8,
                issue: 'FOO-42',
                line: 7,
                message: 'Issue was not found'
            }
        ]
    }
];

module.exports.result.exitCode = 1;