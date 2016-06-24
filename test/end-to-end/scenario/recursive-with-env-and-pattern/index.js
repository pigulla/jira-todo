'use strict';

module.exports.setup = {};
module.exports.result = {};

module.exports.setup.argv = [
    '--monochrome',
    '--format', 'json',
    '--includeValid',
    '--logFormat', 'json',
    '--pattern', '**/*.{js,jsx}',
    '--jsx',
    '--sourceType', 'module',
    '--jiraHost', 'localhost',
    '--jiraProtocol', 'http',
    '--projectsDefault', 'excluded',
    '--projectsFilter', 'TRANS',
    '--projectsFilter', 'FOO',
    '--issueStatusDefault', 'excluded',
    '--issueStatusFilter', '1',
    '--issueTypesDefault', 'excluded',
    '--issueTypesFilter', '1',
    '--jiraPort', '8080'
];

module.exports.setup.env = {
    JT_JIRA_PASSWORD: 'mypass',
    JT_JIRA_USERNAME: 'myuser'
};

module.exports.result.logs = [
    {
        level: 'INFO',
        msg: 'All but the following projects are forbidden: TRANS, FOO'
    },
    {
        level: 'INFO',
        msg: 'All but the following issue types are forbidden: 1'
    },
    {
        level: 'INFO',
        msg: 'All but the following issue status are forbidden: 1'
    },
    {
        level: 'INFO',
        msg: 'Todos without issues are forbidden'
    },
    {
        filename: 'one/service.js',
        level: 'WARN',
        msg: 'Problem found for issue TRANS-1942 in comment starting in line 7: Status "Resolved" (id 5) is not allowed'
    },
    {
        filename: 'one/service.js',
        level: 'INFO',
        msg: 'Valid issue TRANS-2112 found in comment starting in line 10'
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
        reports: [
            {
                valid: false,
                issue: 'TRANS-1942',
                message: 'Status "Resolved" (id 5) is not allowed',
                line: 7,
                column: 4
            },
            {
                valid: true,
                issue: 'TRANS-2112',
                message: 'Issue is valid',
                line: 10,
                column: 17
            }
        ]
    },
    {
        file: 'one/two/Component.jsx',
        reports: [
            {
                valid: false,
                issue: 'DEMO-1058',
                message: 'Project "DEMO" is not allowed',
                line: 4,
                column: 4
            },
            {
                valid: false,
                column: 8,
                issue: 'FOO-42',
                line: 7,
                message: 'Issue was not found'
            }
        ]
    }
];

module.exports.result.exitCode = 1;
