'use strict';

module.exports = {
    debug: true,
    files: [
        {
            pattern: 'test/setup.js',
            instrument: false
        },
        {
            pattern: 'test/end-to-end/Server.js',
            instrument: false
        },
        {
            pattern: 'test/**/*.helper.js',
            instrument: false
        },
        {
            pattern: 'test/fixtures/*',
            instrument: false
        },
        {
            pattern: 'test/integration/*.json',
            instrument: false
        },
        {
            pattern: 'package.json',
            instrument: false
        },
        'src/**/*.js'
    ],
    tests: [
        'test/**/*.spec.js'
    ],
    env: { type: 'node' }
};
